import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AdminAuthProvider } from "./app/AdminAuthContext";
import { ToastProvider } from "./shared/ToastContext";
import AdminApp from "./app/AdminApp";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <AdminAuthProvider>
        <AdminApp />
      </AdminAuthProvider>
    </ToastProvider>
  </StrictMode>,
);
