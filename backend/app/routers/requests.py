from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    DisbursementRequest,
    EventType,
    LineItem,
    Notification,
    RequestEvent,
    RequestStatus,
    Role,
    SystemConfig,
    User,
    UserRole,
)
from ..schemas import (
    LineItemCreate,
    LineItemOut,
    LineItemUpdate,
    RejectBody,
    RequestCreate,
    RequestOut,
    RequestUpdate,
)

router = APIRouter(prefix="/requests", tags=["requests"])

STUB_USER_ID = "00000000-0000-0000-0000-000000000001"
_DEFAULT_THRESHOLD = Decimal("10000")


# --- Helpers ---

def _recalculate_total(request: DisbursementRequest) -> None:
    request.total_amount = sum(
        (item.subtotal for item in request.line_items), Decimal("0.00")
    )


def _get_request_or_404(request_id: str, db: Session) -> DisbursementRequest:
    req = db.get(DisbursementRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return req


def _require_draft(req: DisbursementRequest) -> None:
    if req.status != RequestStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Request must be in DRAFT status to perform this action",
        )


def _get_threshold(db: Session) -> Decimal:
    cfg = db.get(SystemConfig, "finance_approval_threshold_thb")
    if cfg:
        try:
            return Decimal(cfg.value)
        except Exception:
            pass
    return _DEFAULT_THRESHOLD


def _create_event(
    db: Session,
    request_id: str,
    event_type: EventType,
    comment: str | None = None,
) -> RequestEvent:
    event = RequestEvent(
        request_id=request_id,
        actor_id=STUB_USER_ID,
        event_type=event_type,
        comment=comment,
    )
    db.add(event)
    return event


def _notify(db: Session, user_id: str, request_id: str, message: str) -> Notification:
    notif = Notification(
        user_id=user_id,
        request_id=request_id,
        message=message,
        is_read=False,
    )
    db.add(notif)
    return notif


def _finance_user_ids(db: Session) -> list[str]:
    rows = db.query(UserRole).filter(UserRole.role == Role.FINANCE).all()
    return [r.user_id for r in rows]


# --- Request CRUD endpoints ---

@router.post("", response_model=RequestOut, status_code=status.HTTP_201_CREATED)
def create_request(body: RequestCreate, db: Session = Depends(get_db)):
    req = DisbursementRequest(
        requester_id=STUB_USER_ID,
        title=body.title,
        note=body.note,
        status=RequestStatus.DRAFT,
        total_amount=Decimal("0.00"),
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.get("", response_model=list[RequestOut])
def list_requests(db: Session = Depends(get_db)):
    return db.query(DisbursementRequest).order_by(DisbursementRequest.created_at.desc()).all()


@router.get("/{request_id}", response_model=RequestOut)
def get_request(request_id: str, db: Session = Depends(get_db)):
    return _get_request_or_404(request_id, db)


@router.patch("/{request_id}", response_model=RequestOut)
def update_request(request_id: str, body: RequestUpdate, db: Session = Depends(get_db)):
    req = _get_request_or_404(request_id, db)
    _require_draft(req)
    if body.title is not None:
        req.title = body.title
    if body.note is not None:
        req.note = body.note
    db.commit()
    db.refresh(req)
    return req


# --- Workflow action endpoints ---

@router.post("/{request_id}/submit", response_model=RequestOut)
def submit_request(request_id: str, db: Session = Depends(get_db)):
    req = _get_request_or_404(request_id, db)

    if req.status != RequestStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot submit a request with status '{req.status}'",
        )

    if not req.line_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot submit a request with no line items",
        )

    requester = db.get(User, req.requester_id)

    # Self-approval: requester IS their own manager → skip straight to Finance
    if requester and requester.manager_id and requester.manager_id == req.requester_id:
        req.status = RequestStatus.PENDING_FINANCE_APPROVAL
        for fid in _finance_user_ids(db):
            _notify(db, fid, req.id,
                    f"Request '{req.title}' has been submitted and requires Finance approval (self-approval escalation).")
    else:
        req.status = RequestStatus.PENDING_MANAGER_APPROVAL
        if requester and requester.manager_id:
            _notify(db, requester.manager_id, req.id,
                    f"Request '{req.title}' has been submitted and is awaiting your approval.")

    req.submitted_at = datetime.now(timezone.utc)
    req.updated_at = datetime.now(timezone.utc)
    _create_event(db, req.id, EventType.SUBMITTED)
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/cancel", response_model=RequestOut)
def cancel_request(request_id: str, db: Session = Depends(get_db)):
    req = _get_request_or_404(request_id, db)

    cancellable = {
        RequestStatus.DRAFT,
        RequestStatus.PENDING_MANAGER_APPROVAL,
        RequestStatus.PENDING_FINANCE_APPROVAL,
    }
    if req.status not in cancellable:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot cancel a request with status '{req.status}'",
        )

    req.status = RequestStatus.CANCELLED
    req.updated_at = datetime.now(timezone.utc)
    _create_event(db, req.id, EventType.CANCELLED)
    _notify(db, req.requester_id, req.id, f"Your request '{req.title}' has been cancelled.")
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/approve", response_model=RequestOut)
def approve_request(request_id: str, db: Session = Depends(get_db)):
    req = _get_request_or_404(request_id, db)

    if req.status == RequestStatus.PENDING_MANAGER_APPROVAL:
        threshold = _get_threshold(db)
        if req.total_amount <= threshold:
            req.status = RequestStatus.APPROVED
            _create_event(db, req.id, EventType.MANAGER_APPROVED)
            _notify(db, req.requester_id, req.id,
                    f"Your request '{req.title}' has been approved by your manager.")
        else:
            req.status = RequestStatus.PENDING_FINANCE_APPROVAL
            _create_event(db, req.id, EventType.MANAGER_APPROVED)
            _notify(db, req.requester_id, req.id,
                    f"Your request '{req.title}' has been approved by your manager and escalated to Finance (amount: {req.total_amount} THB).")
            for fid in _finance_user_ids(db):
                _notify(db, fid, req.id,
                        f"Request '{req.title}' requires Finance approval (amount: {req.total_amount} THB).")

    elif req.status == RequestStatus.PENDING_FINANCE_APPROVAL:
        req.status = RequestStatus.APPROVED
        _create_event(db, req.id, EventType.FINANCE_APPROVED)
        _notify(db, req.requester_id, req.id,
                f"Your request '{req.title}' has been approved by Finance.")

    else:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot approve a request with status '{req.status}'",
        )

    req.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/reject", response_model=RequestOut)
def reject_request(request_id: str, body: RejectBody, db: Session = Depends(get_db)):
    req = _get_request_or_404(request_id, db)

    rejectable = {
        RequestStatus.PENDING_MANAGER_APPROVAL,
        RequestStatus.PENDING_FINANCE_APPROVAL,
    }
    if req.status not in rejectable:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot reject a request with status '{req.status}'",
        )

    req.status = RequestStatus.REJECTED
    req.updated_at = datetime.now(timezone.utc)
    _create_event(db, req.id, EventType.REJECTED, comment=body.comment)
    _notify(db, req.requester_id, req.id,
            f"Your request '{req.title}' has been rejected. Reason: {body.comment}")
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/pay", response_model=RequestOut)
def pay_request(request_id: str, db: Session = Depends(get_db)):
    req = _get_request_or_404(request_id, db)

    if req.status != RequestStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot mark as paid a request with status '{req.status}'",
        )

    req.status = RequestStatus.PAID
    req.updated_at = datetime.now(timezone.utc)
    _create_event(db, req.id, EventType.PAID)
    _notify(db, req.requester_id, req.id,
            f"Your request '{req.title}' has been marked as paid.")
    db.commit()
    db.refresh(req)
    return req


# --- Line item endpoints ---

@router.post("/{request_id}/line-items", response_model=LineItemOut, status_code=status.HTTP_201_CREATED)
def add_line_item(request_id: str, body: LineItemCreate, db: Session = Depends(get_db)):
    req = _get_request_or_404(request_id, db)
    _require_draft(req)
    subtotal = body.quantity * body.unit_price
    item = LineItem(
        request_id=request_id,
        description=body.description,
        category=body.category,
        quantity=body.quantity,
        unit_price=body.unit_price,
        subtotal=subtotal,
    )
    db.add(item)
    db.flush()
    db.refresh(req)
    _recalculate_total(req)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{request_id}/line-items/{item_id}", response_model=LineItemOut)
def update_line_item(request_id: str, item_id: str, body: LineItemUpdate, db: Session = Depends(get_db)):
    req = _get_request_or_404(request_id, db)
    _require_draft(req)
    item = db.get(LineItem, item_id)
    if not item or item.request_id != request_id:
        raise HTTPException(status_code=404, detail="Line item not found")
    if body.description is not None:
        item.description = body.description
    if body.category is not None:
        item.category = body.category
    if body.quantity is not None:
        item.quantity = body.quantity
    if body.unit_price is not None:
        item.unit_price = body.unit_price
    item.subtotal = item.quantity * item.unit_price
    db.flush()
    db.refresh(req)
    _recalculate_total(req)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{request_id}/line-items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_line_item(request_id: str, item_id: str, db: Session = Depends(get_db)):
    req = _get_request_or_404(request_id, db)
    _require_draft(req)
    item = db.get(LineItem, item_id)
    if not item or item.request_id != request_id:
        raise HTTPException(status_code=404, detail="Line item not found")
    db.delete(item)
    db.flush()
    db.refresh(req)
    _recalculate_total(req)
    db.commit()
