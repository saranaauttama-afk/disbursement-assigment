from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import DisbursementRequest, LineItem, RequestStatus
from ..schemas import LineItemCreate, LineItemOut, LineItemUpdate, RequestCreate, RequestOut, RequestUpdate

router = APIRouter(prefix="/requests", tags=["requests"])

STUB_USER_ID = "00000000-0000-0000-0000-000000000001"


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


# --- Request endpoints ---

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
