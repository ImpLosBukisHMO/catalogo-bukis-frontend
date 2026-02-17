import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router";

import Home from "./components/pages/Home.tsx";
import SignUpPage from "./components/pages/SignUpPage.tsx";
import LogInPage from "./components/pages/LogInPage.tsx";
import ProfilePage from "./components/pages/ProfilePage.tsx";
import SearchProductsPage from "./components/pages/SearchProductsPage.tsx";
import ProductPage from "./components/pages/ProductPage.tsx";
import NotFoundPage from "./components/pages/NotFoundPage.tsx";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/registro", element: <SignUpPage /> },
  { path: "/iniciar-sesion", element: <LogInPage /> },
  { path: "/perfil", element: <ProfilePage /> },
  { path: "/productos/", element: <SearchProductsPage /> },
  { path: "/producto/:id", element: <ProductPage /> },

  { path: "*", element: <NotFoundPage /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
