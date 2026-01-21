import { Routes, Route } from "react-router-dom";

import Home from "./components/pages/Home";
import ProfilePage from "./components/pages/ProfilePage";
import CarritoPage from "./components/pages/CarritoPage";
import LoginPage from "./components/pages/LogInPage";
import SignUpPage from "./components/pages/SignUpPage";
import NotFoundPage from "./components/pages/NotFoundPage";

// Worker
import WorkerLayout from "./components/elements/WorkerLayout";
import WorkerDashboardPage from "./components/pages/WorkerDashboardPage";
import WorkerOrdersPage from "./components/pages/WorkerOrdersPage";
import WorkerProductsPage from "./components/pages/WorkerProductsPage";
import ProductoPage from "./components/pages/ProductoPage";


export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/perfil" element={<ProfilePage />} />
      <Route path="/carrito" element={<CarritoPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/producto/:id" element={<ProductoPage />} />


      {/* Worker (layout + sidebar) */}
      <Route path="/worker" element={<WorkerLayout />}>
        <Route index element={<WorkerDashboardPage />} />
        <Route path="orders" element={<WorkerOrdersPage />} />
        <Route path="products" element={<WorkerProductsPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
