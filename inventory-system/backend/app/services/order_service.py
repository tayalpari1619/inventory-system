from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from decimal import Decimal
from typing import List
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.customer import Customer
from app.schemas.order import OrderCreate, OrderResponse, OrderItemResponse


def _build_order_response(order: Order) -> OrderResponse:
    items = [
        OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            product_name=item.product.name if item.product else "",
        )
        for item in order.items
    ]
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.full_name if order.customer else "",
        status=order.status,
        total_amount=order.total_amount,
        items=items,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


def _load_order(db: Session, order_id: int) -> Order:
    return (
        db.query(Order)
        .options(joinedload(Order.customer),
                 joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id)
        .first()
    )


def list_orders(db: Session, skip: int = 0, limit: int = 100) -> List[OrderResponse]:
    orders = (
        db.query(Order)
        .options(joinedload(Order.customer),
                 joinedload(Order.items).joinedload(OrderItem.product))
        .offset(skip).limit(limit).all()
    )
    return [_build_order_response(o) for o in orders]


def get_order_or_404(db: Session, order_id: int) -> OrderResponse:
    order = _load_order(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Order with id={order_id} not found.")
    return _build_order_response(order)


def create_order(db: Session, data: OrderCreate) -> OrderResponse:
    customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Customer with id={data.customer_id} not found.")

    product_ids = [item.product_id for item in data.items]
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    product_map = {p.id: p for p in products}

    missing = set(product_ids) - set(product_map.keys())
    if missing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Products not found: {sorted(missing)}")

    insufficient = [
        f"'{product_map[item.product_id].name}': requested {item.quantity}, available {product_map[item.product_id].quantity_in_stock}"
        for item in data.items
        if product_map[item.product_id].quantity_in_stock < item.quantity
    ]
    if insufficient:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail={"message": "Insufficient stock.", "details": insufficient})

    total = Decimal("0.00")
    order_items = []
    for item in data.items:
        product = product_map[item.product_id]
        unit_price = Decimal(str(product.price))
        total += unit_price * item.quantity
        product.quantity_in_stock -= item.quantity
        order_items.append(OrderItem(product_id=item.product_id, quantity=item.quantity, unit_price=unit_price))

    order = Order(customer_id=data.customer_id, status=OrderStatus.confirmed,
                  total_amount=total, items=order_items)
    db.add(order)
    db.commit()
    db.refresh(order)
    return get_order_or_404(db, order.id)


def delete_order(db: Session, order_id: int) -> None:
    order = _load_order(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Order with id={order_id} not found.")
    for item in order.items:
        if item.product:
            item.product.quantity_in_stock += item.quantity
    db.delete(order)
    db.commit()