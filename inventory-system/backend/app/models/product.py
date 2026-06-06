from sqlalchemy import Column, Integer, String, Numeric, CheckConstraint, DateTime, func
from app.db.session import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    price = Column(Numeric(12, 2), nullable=False)
    quantity_in_stock = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("quantity_in_stock >= 0", name="ck_product_qty_non_negative"),
        CheckConstraint("price >= 0", name="ck_product_price_non_negative"),
    )