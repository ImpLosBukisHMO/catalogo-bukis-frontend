import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router";

import Home from "./components/pages/Home.tsx";
import SignUpPage from "./components/pages/SignUpPage.tsx";
import LogInPage from "./components/pages/LogInPage.tsx";
import ProfilePage from "./components/pages/ProfilePage.tsx";
import ProductoPage from "./components/pages/ProductoPage.tsx";
import WorkerPage from "./components/pages/WorkerPage.tsx";
import NotFoundPage from "./components/pages/NotFoundPage.tsx";
import CarritoPage from "./components/pages/CarritoPage.tsx";



const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/registro", element: <SignUpPage /> },
  { path: "/iniciar-sesion", element: <LogInPage /> },
  { path: "/perfil", element: <ProfilePage /> },

  { path: "/producto/:id", element: <ProductoPage /> },
  { path: "/worker", element: <WorkerPage /> },
  { path: "/carrito", element: <CarritoPage /> },

  { path: "*", element: <NotFoundPage /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
