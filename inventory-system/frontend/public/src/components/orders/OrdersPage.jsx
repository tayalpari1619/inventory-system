import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { orderApi, customerApi, productApi } from "../../services/resources";
import Modal from "../common/Modal";
import ConfirmDialog from "../common/ConfirmDialog";
import { LoadingSpinner, PageHeader, EmptyState } from "../common/index.jsx";

function CreateOrderForm({ onSubmit, loading }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([{ product_id: "", quantity: 1 }]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    customerApi.list().then((r) => setCustomers(r.data)).catch(() => {});
    productApi.list().then((r) => setProducts(r.data)).catch(() => {});
  }, []);

  const addItem = () => setItems([...items, { product_id: "", quantity: 1 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, key, value) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [key]: value };
    setItems(updated);
  };

  const validate = () => {
    const e = {};
    if (!customerId) e.customer = "Please select a customer.";
    items.forEach((item, i) => {
      if (!item.product_id) e[`product_${i}`] = "Select a product.";
      if (!item.quantity || item.quantity < 1) e[`qty_${i}`] = "Qty must be ≥ 1.";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      customer_id: Number(customerId),
      items: items.map((it) => ({ product_id: Number(it.product_id), quantity: Number(it.quantity) })),
    });
  };

  const calcPreview = () => {
    return items.reduce((sum, item) => {
      const prod = products.find((p) => p.id === Number(item.product_id));
      return sum + (prod ? Number(prod.price) * Number(item.quantity || 0) : 0);
    }, 0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Customer</label>
        <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">-- Select customer --</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
          ))}
        </select>
        {errors.customer && <p className="error-text">{errors.customer}</p>}
      </div>

      <div className="space-y-2">
        <label className="label">Order Items</label>
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1">
              <select
                className="input"
                value={item.product_id}
                onChange={(e) => updateItem(i, "product_id", e.target.value)}
              >
                <option value="">-- Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${Number(p.price).toFixed(2)}) — {p.quantity_in_stock} in stock
                  </option>
                ))}
              </select>
              {errors[`product_${i}`] && <p className="error-text">{errors[`product_${i}`]}</p>}
            </div>
            <div className="w-24">
              <input
                className="input"
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(i, "quantity", e.target.value)}
                placeholder="Qty"
              />
              {errors[`qty_${i}`] && <p className="error-text">{errors[`qty_${i}`]}</p>}
            </div>
            {items.length > 1 && (
              <button type="button" className="btn-danger py-2 px-3 text-xs mt-0" onClick={() => removeItem(i)}>✕</button>
            )}
          </div>
        ))}
        <button type="button" className="btn-secondary text-xs" onClick={addItem}>
          + Add Item
        </button>
      </div>

      <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 border border-slate-200">
        Estimated Total: <span className="text-brand-700 font-bold">${calcPreview().toFixed(2)}</span>
        <span className="text-xs font-normal text-slate-500 ml-2">(final calculated by server)</span>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Creating…" : "Create Order"}
        </button>
      </div>
    </form>
  );
}

function OrderDetailModal({ order, onClose }) {
  if (!order) return null;
  return (
    <Modal isOpen={!!order} onClose={onClose} title={`Order #${order.id}`}>
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide font-semibold">Customer</p>
            <p className="font-medium text-slate-900">{order.customer_name}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide font-semibold">Status</p>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              order.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>
              {order.status}
            </span>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide font-semibold">Date</p>
            <p>{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide font-semibold">Total</p>
            <p className="font-bold text-brand-700 text-base">${Number(order.total_amount).toFixed(2)}</p>
          </div>
        </div>
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide font-semibold mb-2">Items</p>
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                {["Product", "Unit Price", "Qty", "Subtotal"].map((h) => (
                  <th key={h} className="px-2 py-1.5 text-left text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-2 py-1.5">{item.product_name}</td>
                  <td className="px-2 py-1.5">${Number(item.unit_price).toFixed(2)}</td>
                  <td className="px-2 py-1.5">{item.quantity}</td>
                  <td className="px-2 py-1.5 font-medium">${(Number(item.unit_price) * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await orderApi.list();
      setOrders(data);
    } catch {
      toast.error("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCreate = async (payload) => {
    setSaving(true);
    try {
      await orderApi.create(payload);
      toast.success("Order created successfully.");
      setCreateOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await orderApi.delete(deleteTarget.id);
      toast.success("Order cancelled and stock restored.");
      setDeleteTarget(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`${orders.length} order${orders.length !== 1 ? "s" : ""}`}
        action={
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>
            + New Order
          </button>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <EmptyState icon="🛒" title="No orders yet" description="Click 'New Order' to create one." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Order #", "Customer", "Items", "Total", "Status", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-600">#{o.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{o.customer_name}</td>
                  <td className="px-4 py-3 text-slate-600">{o.items.length}</td>
                  <td className="px-4 py-3 font-semibold text-brand-700">${Number(o.total_amount).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      o.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button className="btn-secondary text-xs py-1 px-3" onClick={() => setViewOrder(o)}>
                      View
                    </button>
                    <button className="btn-danger text-xs py-1 px-3" onClick={() => setDeleteTarget(o)}>
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create New Order">
        <CreateOrderForm onSubmit={handleCreate} loading={saving} />
      </Modal>

      <OrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Cancel Order"
        message={`Cancel Order #${deleteTarget?.id}? Stock will be restored automatically.`}
      />
    </div>
  );
}