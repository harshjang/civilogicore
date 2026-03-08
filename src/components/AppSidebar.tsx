import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, MapPin, MessageSquare, FileText, Calculator, Settings } from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/survey", icon: MapPin, label: "Survey Data" },
  { to: "/chat", icon: MessageSquare, label: "AI Assistant" },
  { to: "/documents", icon: FileText, label: "Documents" },
  { to: "/estimations", icon: Calculator, label: "Estimations" },
];

export default function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center glow-cyan">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-mono text-sm font-bold text-foreground tracking-wider">CIVIL</h1>
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest">ENGINEERING AGENT</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-all duration-200 ${
                isActive
                  ? "bg-primary/10 text-primary border-glow border"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse-cyan" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </NavLink>
        <div className="mt-4 px-4">
          <p className="font-mono text-[10px] text-muted-foreground">v1.0.0 · GEOSPATIAL</p>
        </div>
      </div>
    </aside>
  );
}
