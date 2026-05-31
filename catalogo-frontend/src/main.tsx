import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "bulma/css/bulma.min.css";
import { createBrowserRouter, RouterProvider } from "react-router";

import Home from "./components/pages/Home.tsx";
import SignUpPage from "./components/pages/SignUpPage.tsx";
import LogInPage from "./components/pages/LogInPage.tsx";
import ProfilePage from "./components/pages/ProfilePage.tsx";
import SearchProductsPage from "./components/pages/SearchProductsPage.tsx";
import ProductPage from "./components/pages/ProductPage.tsx";
import NotFoundPage from "./components/pages/NotFoundPage.tsx";
import PedidoPage from "./components/pages/PedidoPage.tsx";

// Worker panel
import WorkerLayout from "./components/elements/WorkerLayout.tsx";
import WorkerDashboardPage from "./components/pages/WorkerDashboardPage.tsx";
import WorkerOrdersPage from "./components/pages/WorkerOrdersPage.tsx";
import WorkerProductsPage from "./components/pages/WorkerProductsPage.tsx";

// User features
import CarritoPage from "./components/pages/CarritoPage.tsx";
import FavoritosPage from "./components/pages/FavoritosPage.tsx";
import MisPedidosPage from "./components/pages/MisPedidosPage.tsx";
import PedidoDetallePage from "./components/pages/PedidoDetallePage.tsx";

const router = createBrowserRouter([
  // Public / user routes
  { path: "/", element: <Home /> },
  { path: "/registro", element: <SignUpPage /> },
  { path: "/iniciar-sesion", element: <LogInPage /> },
  { path: "/perfil", element: <ProfilePage /> },
  { path: "/productos/", element: <SearchProductsPage /> },
  { path: "/producto/:id", element: <ProductPage /> },
  { path: "/pedido", element: <PedidoPage /> },

  // New user features
  { path: "/carrito", element: <CarritoPage /> },
  { path: "/favoritos", element: <FavoritosPage /> },
  { path: "/pedidos", element: <MisPedidosPage /> },
  { path: "/pedidos/:id", element: <PedidoDetallePage /> },

  // Worker panel (nested layout with sidebar)
  {
    path: "/worker",
    element: <WorkerLayout />,
    children: [
      { index: true, element: <WorkerDashboardPage /> },
      { path: "orders", element: <WorkerOrdersPage /> },
      { path: "products", element: <WorkerProductsPage /> },
    ],
  },

  { path: "*", element: <NotFoundPage /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
