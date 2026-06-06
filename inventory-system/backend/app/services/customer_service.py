from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.customer import CustomerCreate


def get_customer_or_404(db: Session, customer_id: int) -> Customer:
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Customer with id={customer_id} not found.")
    return customer


def list_customers(db: Session, skip: int = 0, limit: int = 100) -> List[Customer]:
    return db.query(Customer).offset(skip).limit(limit).all()


def create_customer(db: Session, data: CustomerCreate) -> Customer:
    customer = Customer(**data.model_dump())
    db.add(customer)
    try:
        db.commit()
        db.refresh(customer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail=f"A customer with email '{data.email}' already exists.")
    return customer


def delete_customer(db: Session, customer_id: int) -> None:
    customer = get_customer_or_404(db, customer_id)
    has_orders = db.query(Order).filter(Order.customer_id == customer_id).first()
    if has_orders:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Cannot delete customer — they have existing orders.")
    db.delete(customer)
    db.commit()