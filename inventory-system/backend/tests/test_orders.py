import pytest


def _create_product(client, sku="P-001", qty=50, price=10.00):
    return client.post("/api/v1/products/", json={
        "name": "Test Product", "sku": sku, "price": price, "quantity_in_stock": qty
    }).json()


def _create_customer(client, email="test@example.com"):
    return client.post("/api/v1/customers/", json={
        "full_name": "Test User", "email": email
    }).json()


def test_create_order_reduces_stock(client):
    product = _create_product(client, qty=50)
    customer = _create_customer(client)

    res = client.post("/api/v1/orders/", json={
        "customer_id": customer["id"],
        "items": [{"product_id": product["id"], "quantity": 10}],
    })
    assert res.status_code == 201
    order = res.json()
    assert float(order["total_amount"]) == 100.00

    # Verify stock was reduced
    updated = client.get(f"/api/v1/products/{product['id']}").json()
    assert updated["quantity_in_stock"] == 40


def test_order_insufficient_stock(client):
    product = _create_product(client, qty=5)
    customer = _create_customer(client)

    res = client.post("/api/v1/orders/", json={
        "customer_id": customer["id"],
        "items": [{"product_id": product["id"], "quantity": 10}],
    })
    assert res.status_code == 422


def test_cancel_order_restores_stock(client):
    product = _create_product(client, qty=20)
    customer = _create_customer(client)

    order = client.post("/api/v1/orders/", json={
        "customer_id": customer["id"],
        "items": [{"product_id": product["id"], "quantity": 5}],
    }).json()

    # Cancel the order
    res = client.delete(f"/api/v1/orders/{order['id']}")
    assert res.status_code == 204

    # Stock should be restored
    updated = client.get(f"/api/v1/products/{product['id']}").json()
    assert updated["quantity_in_stock"] == 20


def test_order_invalid_customer(client):
    product = _create_product(client)
    res = client.post("/api/v1/orders/", json={
        "customer_id": 9999,
        "items": [{"product_id": product["id"], "quantity": 1}],
    })
    assert res.status_code == 404


def test_order_duplicate_products_rejected(client):
    product = _create_product(client)
    customer = _create_customer(client)

    res = client.post("/api/v1/orders/", json={
        "customer_id": customer["id"],
        "items": [
            {"product_id": product["id"], "quantity": 1},
            {"product_id": product["id"], "quantity": 2},
        ],
    })
    assert res.status_code == 422


def test_total_calculated_correctly(client):
    p1 = _create_product(client, sku="P-001", qty=50, price=10.00)
    p2 = _create_product(client, sku="P-002", qty=50, price=25.50)
    customer = _create_customer(client)

    res = client.post("/api/v1/orders/", json={
        "customer_id": customer["id"],
        "items": [
            {"product_id": p1["id"], "quantity": 3},   # 3 × 10.00 = 30.00
            {"product_id": p2["id"], "quantity": 2},   # 2 × 25.50 = 51.00
        ],
    })
    assert res.status_code == 201
    assert float(res.json()["total_amount"]) == 81.00