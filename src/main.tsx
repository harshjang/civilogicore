import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { AuthProvider } from "@/contexts/AuthContext";

// Theme preload
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") {
  document.documentElement.classList.add("light");
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => r.unregister());
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <WorkspaceProvider>
        <App />
      </WorkspaceProvider>
    </AuthProvider>
  </React.StrictMode>
);