import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/common/Sidebar";
import DashboardPage from "./components/dashboard/DashboardPage";
import ProductsPage from "./components/products/ProductsPage";
import CustomersPage from "./components/customers/CustomersPage";
import OrdersPage from "./components/orders/OrdersPage";

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/orders" element={<OrdersPage />} />
        </Routes>
      </main>
    </div>
  );
}