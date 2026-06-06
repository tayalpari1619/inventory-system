from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List
from app.models.product import Product
from app.models.order import OrderItem
from app.schemas.product import ProductCreate, ProductUpdate


def get_product_or_404(db: Session, product_id: int) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Product with id={product_id} not found.")
    return product


def list_products(db: Session, skip: int = 0, limit: int = 100) -> List[Product]:
    return db.query(Product).offset(skip).limit(limit).all()


def create_product(db: Session, data: ProductCreate) -> Product:
    product = Product(**data.model_dump())
    db.add(product)
    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail=f"A product with SKU '{data.sku}' already exists.")
    return product


def update_product(db: Session, product_id: int, data: ProductUpdate) -> Product:
    product = get_product_or_404(db, product_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="A product with that SKU already exists.")
    return product


def delete_product(db: Session, product_id: int) -> None:
    product = get_product_or_404(db, product_id)
    in_order = db.query(OrderItem).filter(OrderItem.product_id == product_id).first()
    if in_order:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Cannot delete product — it is referenced by existing orders.")
    db.delete(product)
    db.commit()