import { Routes, Route } from "react-router-dom";

import Home from "./components/pages/Home";
import ProfilePage from "./components/pages/ProfilePage";
import CarritoPage from "./components/pages/CarritoPage";
import LoginPage from "./components/pages/LogInPage";
import SignUpPage from "./components/pages/SignUpPage";
import ProductoPage from "./components/pages/ProductoPage";
import NotFoundPage from "./components/pages/NotFoundPage";

export default function AppRouter() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      {/* Usuario */}
      <Route path="/perfil" element={<ProfilePage />} />
      <Route path="/carrito" element={<CarritoPage />} />

      {/* Producto */}
      <Route path="/producto/:id" element={<ProductoPage />} />

      {/* Catch all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
