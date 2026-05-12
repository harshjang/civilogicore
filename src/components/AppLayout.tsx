import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";

export default function AppLayout() {
  return (
    <div className="relative flex h-screen overflow-hidden bg-background text-foreground font-body">
      <div className="absolute inset-0 blueprint-grid pointer-events-none z-0" />
      <div className="absolute inset-0 blueprint-grid-fine opacity-35 pointer-events-none z-0" />
      <AppSidebar />
      <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
