import { useEffect, useState } from "react";
import { Layers, FileText, Activity, Crosshair, Ruler, MapPin } from "lucide-react";
import StatCard from "@/components/StatCard";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [stats, setStats] = useState({ points: 0, documents: 0, estimations: 0 });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [profileRes, pointsRes, docsRes, estRes] = await Promise.all([
        supabase.from("profiles").select("display_name, username").eq("user_id", user.id).single(),
        supabase.from("survey_points").select("id", { count: "exact", head: true }),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("type", "file"),
        supabase.from("estimations").select("id", { count: "exact", head: true }),
      ]);

      if (profileRes.data) {
        setDisplayName(profileRes.data.display_name || profileRes.data.username);
      }
      setStats({
        points: pointsRes.count ?? 0,
        documents: docsRes.count ?? 0,
        estimations: estRes.count ?? 0,
      });
    };

    fetchData();
  }, [user]);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 pt-14 md:pt-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-xl md:text-2xl font-mono font-bold text-foreground">
          {displayName ? `Welcome, ${displayName}` : "Dashboard"}
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground font-mono mt-1">
          SYSTEM STATUS · ALL MODULES OPERATIONAL
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <StatCard icon={Crosshair} label="Survey Points" value={String(stats.points)} subtitle={stats.points === 0 ? "No surveys yet" : "Total points"} variant="cyan" />
        <StatCard icon={FileText} label="Documents" value={String(stats.documents)} subtitle={stats.documents === 0 ? "No documents yet" : "Total files"} variant="default" />
        <StatCard icon={Ruler} label="Estimations" value={String(stats.estimations)} subtitle={stats.estimations === 0 ? "No estimates yet" : "Total saved"} variant="orange" />
        <StatCard icon={Activity} label="AI Queries" value="—" subtitle="Use AI Assistant" variant="green" />
      </motion.div>

      {/* Recent Survey Points */}
      <motion.div
        className="bg-card rounded-lg border border-border"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="p-4 md:p-5 border-b border-border">
          <h2 className="font-mono text-xs md:text-sm font-semibold text-foreground">RECENT SURVEYS</h2>
          <p className="font-mono text-[10px] md:text-xs text-muted-foreground mt-0.5">Latest geospatial data imports</p>
        </div>
        <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center">
          <Crosshair className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="font-mono text-sm text-muted-foreground">
            {stats.points === 0 ? "No surveys imported yet" : `${stats.points} points recorded`}
          </p>
          <p className="font-mono text-xs text-muted-foreground/60 mt-1">
            {stats.points === 0 ? "Import survey data to see it here" : "View all in Survey Data"}
          </p>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        {[
          { icon: Crosshair, title: "Import Survey Data", desc: "Upload coordinates from Total Station, DGPS, or Drone", path: "/survey" },
          { icon: Ruler, title: "New Estimation", desc: "Calculate earthwork, material, or structural estimates", path: "/estimations" },
          { icon: MapPin, title: "Generate DXF", desc: "Create AutoCAD-ready DXF files from survey points", path: "/survey" },
        ].map((action) => (
          <button
            key={action.title}
            onClick={() => navigate(action.path)}
            className="bg-card rounded-lg border border-border p-4 md:p-5 text-left hover:border-primary/30 hover:glow-cyan transition-all duration-200 group"
          >
            <action.icon className="w-5 md:w-6 h-5 md:h-6 text-primary mb-2 md:mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-mono text-xs md:text-sm font-semibold text-foreground">{action.title}</h3>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">{action.desc}</p>
          </button>
        ))}
      </motion.div>
    </div>
  );
}
