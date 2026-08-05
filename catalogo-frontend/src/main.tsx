import { lazy, StrictMode, Suspense, type ComponentProps } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import { queryClient } from "./lib/queryClient.ts";

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
import { WorkerProviders } from "./components/providers/WorkerProviders.tsx";

// User features
import CarritoPage from "./components/pages/CarritoPage.tsx";
import FavoritosPage from "./components/pages/FavoritosPage.tsx";
import MisPedidosPage from "./components/pages/MisPedidosPage.tsx";
import PedidoDetallePage from "./components/pages/PedidoDetallePage.tsx";

import { AuthProvider } from "./context/AuthProvider";
import { WorkerDiscountsPage } from "./components/pages/WorkerDiscountsPage.tsx";
import { isBannerOfertasEnabled } from "./utils/featureFlags";
import ConfirmAccountPage from "./components/pages/ConfirmAccountPage.tsx";
import ForgotPasswordPage from "./components/pages/ForgotPasswordPage.tsx";

const WorkerBannerOfertasPage = lazy(() => import("./components/pages/WorkerBannerOfertasPage.tsx"));

const workerChildren = [
  { index: true, element: <WorkerDashboardPage /> },
  { path: "orders", element: <WorkerOrdersPage /> },
  { path: "products", element: <WorkerProductsPage /> },
  { path: "discounts", element: <WorkerDiscountsPage /> },
  ...(isBannerOfertasEnabled ? [{
    path: "banner-ofertas",
    element: (
      <Suspense fallback={null}>
        <WorkerBannerOfertasPage />
      </Suspense>
    ),
  }] : []),
];

const router = createBrowserRouter([
  // Public / user routes
  { path: "/", element: <Home /> },
  { path: "/registro", element: <SignUpPage /> },
  { path: "/iniciar-sesion", element: <LogInPage /> },
  { path: "/confirmar-cuenta", element: <ConfirmAccountPage /> },
  { path: "/recuperar-password", element: <ForgotPasswordPage /> },
  { path: "/perfil", element: <ProfilePage /> },
  { path: "/productos", element: <SearchProductsPage /> },
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
    element: (
      <WorkerProviders>
        <WorkerLayout />
      </WorkerProviders>
    ),
    children: workerChildren,
  },

  { path: "*", element: <NotFoundPage /> },
]);

type AppProps = {
  router?: ComponentProps<typeof RouterProvider>["router"];
};

export function App({ router: appRouter = router }: AppProps) {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={appRouter} />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </AuthProvider>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
