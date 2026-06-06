from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.order import DashboardStats

LOW_STOCK_THRESHOLD = 10


def get_dashboard_stats(db: Session) -> DashboardStats:
    low_stock = (
        db.query(Product)
        .filter(Product.quantity_in_stock <= LOW_STOCK_THRESHOLD)
        .order_by(Product.quantity_in_stock.asc())
        .limit(20).all()
    )
    return DashboardStats(
        total_products=db.query(Product).count(),
        total_customers=db.query(Customer).count(),
        total_orders=db.query(Order).count(),
        low_stock_products=[
            {"id": p.id, "name": p.name, "sku": p.sku, "quantity_in_stock": p.quantity_in_stock}
            for p in low_stock
        ],
    )