from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, field_validator

from .models import Category, RequestStatus


# --- Line Item ---

class LineItemCreate(BaseModel):
    description: str
    category: Category
    quantity: int
    unit_price: Decimal

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("quantity must be at least 1")
        return v

    @field_validator("unit_price")
    @classmethod
    def price_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("unit_price must be greater than 0")
        return v


class LineItemUpdate(BaseModel):
    description: str | None = None
    category: Category | None = None
    quantity: int | None = None
    unit_price: Decimal | None = None


class LineItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    request_id: str
    description: str
    category: Category
    quantity: int
    unit_price: Decimal
    subtotal: Decimal


# --- Disbursement Request ---

class RequestCreate(BaseModel):
    title: str
    note: str | None = None


class RequestUpdate(BaseModel):
    title: str | None = None
    note: str | None = None


class RequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    requester_id: str
    title: str
    note: str | None
    status: RequestStatus
    total_amount: Decimal
    created_at: datetime
    updated_at: datetime
    submitted_at: datetime | None
    line_items: list[LineItemOut] = []
