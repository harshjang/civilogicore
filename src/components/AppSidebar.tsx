import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, MapPin, MessageSquare, FileText, Calculator, Settings, Menu, LogOut } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.svg";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/survey", icon: MapPin, label: "Survey Data" },
  { to: "/chat", icon: MessageSquare, label: "AI Assistant" },
  { to: "/documents", icon: FileText, label: "Documents" },
  { to: "/estimations", icon: Calculator, label: "Estimations" },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <motion.img
            src={logo}
            alt="CiviLogiCore"
            className="w-10 h-10"
            initial={{ filter: "brightness(0) blur(4px)", scale: 0.7, opacity: 0 }}
            animate={{ filter: "brightness(1) blur(0px)", scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{ filter: "drop-shadow(0 0 10px hsl(187 80% 48% / 0.3))" }}
          />
          <div>
            <h1 className="font-mono text-sm font-bold text-foreground tracking-wider">
              <span className="text-gradient-cyan">C</span>IVI<span className="text-gradient-cyan">L</span>OGI<span className="text-gradient-cyan">C</span>ORE
            </h1>
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
              onClick={onNavigate}
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
      <div className="p-4 border-t border-sidebar-border space-y-1">
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </NavLink>
        <button
          onClick={() => { signOut(); onNavigate?.(); }}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
        <div className="mt-4 px-4">
          <p className="font-mono text-[10px] text-muted-foreground">v1.0.0 · GEOSPATIAL</p>
        </div>
      </div>
    </div>
  );
}

export default function AppSidebar() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border text-foreground hover:bg-secondary transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      <SidebarContent />
    </aside>
  );
}
