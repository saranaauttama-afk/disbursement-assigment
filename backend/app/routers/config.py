from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Role, SystemConfig, User
from ..auth import get_current_user
from ..schemas import ConfigOut, ConfigUpdate

router = APIRouter(prefix="/config", tags=["config"])


def _require_admin(current_user: User = Depends(get_current_user)):
    if not any(r.role == Role.ADMIN for r in current_user.roles):
        raise HTTPException(status_code=403, detail="Admin role required")
    return current_user


@router.get("", response_model=list[ConfigOut])
def get_config(db: Session = Depends(get_db), _: User = Depends(_require_admin)):
    return db.query(SystemConfig).all()


@router.patch("/{key}", response_model=ConfigOut)
def update_config(
    key: str,
    body: ConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    cfg = db.get(SystemConfig, key)
    if not cfg:
        cfg = SystemConfig(key=key, value=body.value, updated_by=current_user.id)
        db.add(cfg)
    else:
        cfg.value = body.value
        cfg.updated_at = datetime.now(timezone.utc)
        cfg.updated_by = current_user.id
    db.commit()
    db.refresh(cfg)
    return cfg
