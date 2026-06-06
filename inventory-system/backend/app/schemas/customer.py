from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional


class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone_number: Optional[str] = Field(None, max_length=30)


class CustomerCreate(CustomerBase):
    pass


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}