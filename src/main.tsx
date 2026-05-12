import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { WorkspaceProvider } from "@/contexts/WorkspaceContext";

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") {
  document.documentElement.classList.add("light");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WorkspaceProvider>
      <App />
    </WorkspaceProvider>
  </React.StrictMode>
);
