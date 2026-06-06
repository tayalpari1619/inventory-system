from pydantic import BaseModel, Field, model_validator
from decimal import Decimal
from datetime import datetime
from typing import List
from app.models.order import OrderStatus


class OrderItemCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    product_name: str = ""

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    customer_id: int = Field(..., gt=0)
    items: List[OrderItemCreate] = Field(..., min_length=1)

    @model_validator(mode="after")
    def no_duplicate_products(self) -> "OrderCreate":
        product_ids = [item.product_id for item in self.items]
        if len(product_ids) != len(set(product_ids)):
            raise ValueError("Duplicate product IDs in the same order are not allowed.")
        return self


class OrderResponse(BaseModel):
    id: int
    customer_id: int
    customer_name: str = ""
    status: OrderStatus
    total_amount: Decimal
    items: List[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: List[dict]