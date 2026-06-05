import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dashboardApi } from "../../services/resources";
import { LoadingSpinner } from "../common/index.jsx";

function StatCard({ icon, label, value, linkTo, color }) {
  return (
    <Link to={linkTo} className="card p-6 flex items-center gap-4 hover:shadow-md transition-shadow group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{value}</p>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.stats()
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">System overview at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon="📦" label="Total Products" value={stats?.total_products ?? 0} linkTo="/products" color="bg-blue-50" />
        <StatCard icon="👥" label="Total Customers" value={stats?.total_customers ?? 0} linkTo="/customers" color="bg-purple-50" />
        <StatCard icon="🛒" label="Total Orders" value={stats?.total_orders ?? 0} linkTo="/orders" color="bg-green-50" />
      </div>

      {/* Low Stock Alert */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⚠️</span>
          <h2 className="text-base font-semibold text-slate-900">Low Stock Products</h2>
          <span className="ml-auto text-xs text-slate-400">(≤ 10 units)</span>
        </div>

        {stats?.low_stock_products?.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            <span>✅</span> All products have sufficient stock.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-amber-200">
            <table className="w-full text-sm">
              <thead className="bg-amber-50">
                <tr>
                  {["Product", "SKU", "Stock"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-amber-700 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {stats?.low_stock_products?.map((p) => (
                  <tr key={p.id} className="bg-amber-50/50">
                    <td className="px-4 py-2 font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-500">{p.sku}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        p.quantity_in_stock === 0
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {p.quantity_in_stock === 0 ? "OUT OF STOCK" : p.quantity_in_stock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}