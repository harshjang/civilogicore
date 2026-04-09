import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";

export default function AppLayout() {
  return (
    <div className="relative flex min-h-screen bg-background text-foreground overflow-hidden font-body">
  
  {/* Base Grid */}
  <div className="absolute inset-0 blueprint-grid pointer-events-none z-0" />
  
  {/* Fine Grid Overlay */}
  <div className="absolute inset-0 blueprint-grid-fine opacity-40 pointer-events-none z-0" />
  
  {/* Cyan Glow Gradient */}
  <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--blueprint-cyan)/0.08)] via-transparent to-[hsl(195_70%_60%/0.05)] pointer-events-none z-0" />

  {/* Actual Layout */}
  <AppSidebar />

  <main className="relative z-10 flex-1 overflow-auto min-w-0 p-6">
    <Outlet />
  </main>
  </main>
</div>
  );
}
