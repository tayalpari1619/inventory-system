import pytest


PRODUCT_PAYLOAD = {
    "name": "Wireless Keyboard",
    "sku": "WK-001",
    "price": 49.99,
    "quantity_in_stock": 100,
}


def test_create_product(client):
    res = client.post("/api/v1/products/", json=PRODUCT_PAYLOAD)
    assert res.status_code == 201
    data = res.json()
    assert data["sku"] == "WK-001"
    assert data["name"] == "Wireless Keyboard"
    assert float(data["price"]) == 49.99


def test_create_product_duplicate_sku(client):
    client.post("/api/v1/products/", json=PRODUCT_PAYLOAD)
    res = client.post("/api/v1/products/", json=PRODUCT_PAYLOAD)
    assert res.status_code == 409


def test_list_products(client):
    client.post("/api/v1/products/", json=PRODUCT_PAYLOAD)
    res = client.get("/api/v1/products/")
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_get_product_by_id(client):
    created = client.post("/api/v1/products/", json=PRODUCT_PAYLOAD).json()
    res = client.get(f"/api/v1/products/{created['id']}")
    assert res.status_code == 200
    assert res.json()["id"] == created["id"]


def test_get_product_not_found(client):
    res = client.get("/api/v1/products/9999")
    assert res.status_code == 404


def test_update_product(client):
    created = client.post("/api/v1/products/", json=PRODUCT_PAYLOAD).json()
    res = client.put(f"/api/v1/products/{created['id']}", json={"price": 59.99})
    assert res.status_code == 200
    assert float(res.json()["price"]) == 59.99


def test_delete_product(client):
    created = client.post("/api/v1/products/", json=PRODUCT_PAYLOAD).json()
    res = client.delete(f"/api/v1/products/{created['id']}")
    assert res.status_code == 204

    res = client.get(f"/api/v1/products/{created['id']}")
    assert res.status_code == 404


def test_negative_price_rejected(client):
    payload = {**PRODUCT_PAYLOAD, "price": -5}
    res = client.post("/api/v1/products/", json=payload)
    assert res.status_code == 422


def test_negative_quantity_rejected(client):
    payload = {**PRODUCT_PAYLOAD, "quantity_in_stock": -1}
    res = client.post("/api/v1/products/", json=payload)
    assert res.status_code == 422