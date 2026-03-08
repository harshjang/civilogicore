import { MapPin, Layers, FileText, Activity, Crosshair, Ruler } from "lucide-react";
import StatCard from "@/components/StatCard";
import { motion } from "framer-motion";

const recentSurveys = [
  { id: "SRV-001", name: "Highway Bridge Alignment", points: 248, source: "Total Station", status: "Complete" },
  { id: "SRV-002", name: "Residential Plot Boundary", points: 56, source: "DGPS", status: "Processing" },
  { id: "SRV-003", name: "Drainage Canal Topo", points: 1024, source: "Drone", status: "In Review" },
  { id: "SRV-004", name: "Road Centerline Survey", points: 180, source: "Total Station", status: "Complete" },
];

const statusColors: Record<string, string> = {
  Complete: "text-survey-green",
  Processing: "text-survey-orange",
  "In Review": "text-primary",
};

export default function Index() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-mono font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">
          SYSTEM STATUS · ALL MODULES OPERATIONAL
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <StatCard icon={Crosshair} label="Survey Points" value="1,508" subtitle="4 active surveys" variant="cyan" />
        <StatCard icon={Layers} label="DWG Layers" value="24" subtitle="Across all projects" variant="orange" />
        <StatCard icon={FileText} label="Documents" value="37" subtitle="12 pending review" variant="default" />
        <StatCard icon={Activity} label="AI Queries" value="142" subtitle="This month" variant="green" />
      </motion.div>

      {/* Recent Surveys Table */}
      <motion.div
        className="bg-card rounded-lg border border-border"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-mono text-sm font-semibold text-foreground">RECENT SURVEYS</h2>
            <p className="font-mono text-xs text-muted-foreground mt-0.5">Latest geospatial data imports</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-cyan" />
            LIVE
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
                <th className="px-5 py-3 text-left text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Survey Name</th>
                <th className="px-5 py-3 text-left text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Points</th>
                <th className="px-5 py-3 text-left text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Source</th>
                <th className="px-5 py-3 text-left text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSurveys.map((survey, i) => (
                <tr key={survey.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-primary">{survey.id}</td>
                  <td className="px-5 py-4 text-sm text-foreground">{survey.name}</td>
                  <td className="px-5 py-4 font-mono text-sm text-foreground">{survey.points.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-xs font-mono text-secondary-foreground">
                      <MapPin className="w-3 h-3" />
                      {survey.source}
                    </span>
                  </td>
                  <td className={`px-5 py-4 font-mono text-xs font-semibold ${statusColors[survey.status]}`}>
                    {survey.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        {[
          { icon: Crosshair, title: "Import Survey Data", desc: "Upload coordinates from Total Station, DGPS, or Drone" },
          { icon: Ruler, title: "New Estimation", desc: "Calculate earthwork, material, or structural estimates" },
          { icon: MapPin, title: "Generate DWG", desc: "Create AutoCAD-ready files with proper layering" },
        ].map((action) => (
          <button
            key={action.title}
            className="bg-card rounded-lg border border-border p-5 text-left hover:border-primary/30 hover:glow-cyan transition-all duration-200 group"
          >
            <action.icon className="w-6 h-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-mono text-sm font-semibold text-foreground">{action.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{action.desc}</p>
          </button>
        ))}
      </motion.div>
    </div>
  );
}
