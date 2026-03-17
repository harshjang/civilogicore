import { createRoot } from "react-dom/client";
import { useWorkspace, WorkspaceProvider } from "@/contexts/WorkspaceContext";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme before render to prevent flash
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") {
  document.documentElement.classList.add("light");
}

createRoot(document.getElementById("root")!).render(<App />);

<WorkspaceProvider>
  <App />
</WorkspaceProvider>;

const workspace = useWorkspace();

if (!workspace) {
  throw new Error("WorkspaceProvider not found");
}

const { activeModule, setActiveModule } = workspace;