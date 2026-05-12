import { useEffect, useState } from "react";
import { Activity, Bot, Crosshair, FileText, MapPin, Ruler, Send } from "lucide-react";
import StatCard from "@/components/StatCard";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const quickPrompts = [
  "Estimate earthwork for a 500 m road section",
  "Prepare a checklist for importing Total Station data",
  "Explain contour generation from surveyed points",
];

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

      if (profileRes.data) setDisplayName(profileRes.data.display_name || profileRes.data.username);
      setStats({
        points: pointsRes.count ?? 0,
        documents: docsRes.count ?? 0,
        estimations: estRes.count ?? 0,
      });
    };

    fetchData();
  }, [user]);

  return (
    <div className="h-full overflow-y-auto px-4 py-6 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6 md:space-y-8">
        <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="pt-10 md:pt-2">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Project command center</p>
          <h1 className="mt-3 text-2xl font-semibold text-foreground md:text-4xl">
            {displayName ? `Welcome, ${displayName}` : "Welcome to CiviLogiCore"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Bring survey points, drawings, documents, estimates, and engineering questions into one focused workspace.
          </p>
        </motion.header>

        <motion.div
          className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <StatCard icon={Crosshair} label="Survey Points" value={String(stats.points)} subtitle={stats.points === 0 ? "No surveys yet" : "Total points"} variant="cyan" />
          <StatCard icon={FileText} label="Documents" value={String(stats.documents)} subtitle={stats.documents === 0 ? "No documents yet" : "Total files"} variant="default" />
          <StatCard icon={Ruler} label="Estimations" value={String(stats.estimations)} subtitle={stats.estimations === 0 ? "No estimates yet" : "Total saved"} variant="orange" />
          <StatCard icon={Activity} label="AI Queries" value="-" subtitle="Use AI Assistant" variant="green" />
        </motion.div>

        <motion.section
          className="rounded-lg border border-border bg-card/80"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <div className="border-b border-border p-4 md:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-mono text-sm font-semibold text-foreground">Ask the Civil Engineering Agent</h2>
                <p className="text-xs text-muted-foreground">Start with a calculation, survey workflow, or planning question.</p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-3 md:p-5">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => navigate("/chat", { state: { prompt } })}
                className="min-h-24 rounded-lg border border-border bg-background/50 p-4 text-left text-sm leading-6 text-foreground transition-colors hover:border-primary/40 hover:bg-secondary/70"
              >
                {prompt}
              </button>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          {[
            { icon: Crosshair, title: "Import Survey Data", desc: "Upload coordinates from Total Station, DGPS, or drone workflows.", path: "/survey" },
            { icon: Ruler, title: "New Estimation", desc: "Calculate earthwork, material quantities, or structural estimates.", path: "/estimations" },
            { icon: MapPin, title: "Generate DXF", desc: "Create AutoCAD-ready geometry from survey points.", path: "/survey" },
          ].map((action) => (
            <button
              key={action.title}
              onClick={() => navigate(action.path)}
              className="rounded-lg border border-border bg-card/80 p-5 text-left transition-all duration-200 hover:border-primary/40 hover:bg-secondary/70"
            >
              <action.icon className="mb-4 h-6 w-6 text-primary" />
              <h3 className="font-mono text-sm font-semibold text-foreground">{action.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.desc}</p>
            </button>
          ))}
        </motion.section>

        <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/90 p-4 backdrop-blur md:-mx-8 md:px-8">
          <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-lg border border-border bg-card p-2">
            <div className="flex-1 px-3 font-mono text-sm text-muted-foreground">Ask about survey, quantities, drawings, or construction planning...</div>
            <Button size="icon" onClick={() => navigate("/chat")}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
