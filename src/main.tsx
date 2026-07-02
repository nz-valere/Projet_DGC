import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { queryClient } from "@/api/query-client";
import { router } from "@/app/router";
import { AuthProvider } from "@/features/auth/auth-context";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Élément #root introuvable");

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster richColors closeButton position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
