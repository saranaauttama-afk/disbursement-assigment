import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Role, User, UserRole
from ..auth import get_current_user, hash_password
from ..schemas import UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


def _require_admin(current_user: User = Depends(get_current_user)):
    if not any(r.role == Role.ADMIN for r in current_user.roles):
        raise HTTPException(status_code=403, detail="Admin role required")
    return current_user


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(_require_admin)):
    users = db.query(User).all()
    return [
        UserOut(id=u.id, name=u.name, email=u.email, roles=[r.role.value for r in u.roles])
        for u in users
    ]


@router.post("", response_model=UserOut, status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db), _: User = Depends(_require_admin)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="Email already exists")
    user = User(
        id=str(uuid.uuid4()),
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        manager_id=body.manager_id,
    )
    db.add(user)
    db.flush()
    for role_str in body.roles:
        db.add(UserRole(user_id=user.id, role=Role(role_str)))
    db.commit()
    db.refresh(user)
    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        roles=[r.role.value for r in user.roles],
    )


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    body: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(_require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if body.manager_id is not None:
        user.manager_id = body.manager_id
    if body.roles is not None:
        for ur in user.roles:
            db.delete(ur)
        db.flush()
        for role_str in body.roles:
            db.add(UserRole(user_id=user.id, role=Role(role_str)))
    db.commit()
    db.refresh(user)
    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        roles=[r.role.value for r in user.roles],
    )
