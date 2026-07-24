import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean, DateTime, Enum, ForeignKey,
    Integer, Numeric, String, Text, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

import enum


class Role(str, enum.Enum):
    REQUESTER = "REQUESTER"
    MANAGER = "MANAGER"
    FINANCE = "FINANCE"
    ADMIN = "ADMIN"


class RequestStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING_MANAGER_APPROVAL = "PENDING_MANAGER_APPROVAL"
    PENDING_FINANCE_APPROVAL = "PENDING_FINANCE_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"


class Category(str, enum.Enum):
    TRAVEL = "TRAVEL"
    EQUIPMENT = "EQUIPMENT"
    ENTERTAINMENT = "ENTERTAINMENT"
    MISC = "MISC"


class EventType(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    MANAGER_APPROVED = "MANAGER_APPROVED"
    FINANCE_APPROVED = "FINANCE_APPROVED"
    REJECTED = "REJECTED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"


def _uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    manager_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    roles: Mapped[list["UserRole"]] = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    requests: Mapped[list["DisbursementRequest"]] = relationship("DisbursementRequest", back_populates="requester")


class UserRole(Base):
    __tablename__ = "user_roles"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), primary_key=True)
    role: Mapped[Role] = mapped_column(Enum(Role), primary_key=True)

    user: Mapped["User"] = relationship("User", back_populates="roles")


class DisbursementRequest(Base):
    __tablename__ = "disbursement_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    requester_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[RequestStatus] = mapped_column(Enum(RequestStatus), nullable=False, default=RequestStatus.DRAFT)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    requester: Mapped["User"] = relationship("User", back_populates="requests")
    line_items: Mapped[list["LineItem"]] = relationship(
        "LineItem", back_populates="request", cascade="all, delete-orphan"
    )
    events: Mapped[list["RequestEvent"]] = relationship("RequestEvent", back_populates="request")


class LineItem(Base):
    __tablename__ = "line_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    request_id: Mapped[str] = mapped_column(String(36), ForeignKey("disbursement_requests.id"), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[Category] = mapped_column(Enum(Category), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    request: Mapped["DisbursementRequest"] = relationship("DisbursementRequest", back_populates="line_items")


class RequestEvent(Base):
    __tablename__ = "request_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    request_id: Mapped[str] = mapped_column(String(36), ForeignKey("disbursement_requests.id"), nullable=False)
    actor_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    event_type: Mapped[EventType] = mapped_column(Enum(EventType), nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    request: Mapped["DisbursementRequest"] = relationship("DisbursementRequest", back_populates="events")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    request_id: Mapped[str] = mapped_column(String(36), ForeignKey("disbursement_requests.id"), nullable=False)
    message: Mapped[str] = mapped_column(String(512), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class SystemConfig(Base):
    __tablename__ = "system_config"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[str] = mapped_column(String(255), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
