import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background blueprint-grid">
      <AppSidebar />
      <main className="flex-1 overflow-auto min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
