import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Upload, Plus, Trash2, Download, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SurveyPoint {
  id: string;
  pointNo: string;
  easting: string;
  northing: string;
  elevation: string;
  code: string;
  layer: string;
}

const defaultLayers = ["Boundary", "Centerline", "Contour", "Structure", "Road", "Drainage", "Utility"];

export default function SurveyData() {
  const [source, setSource] = useState("total-station");
  const [points, setPoints] = useState<SurveyPoint[]>([]);

  const addPoint = () => {
    const newId = String(points.length + 1);
    setPoints([...points, { id: newId, pointNo: newId, easting: "", northing: "", elevation: "", code: "", layer: "Boundary" }]);
  };

  const removePoint = (id: string) => {
    setPoints(points.filter((p) => p.id !== id));
  };

  const updatePoint = (id: string, field: keyof SurveyPoint, value: string) => {
    setPoints(points.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  return (
    <div className="p-4 md:p-8 space-y-6 pt-14 md:pt-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl md:text-2xl font-mono font-bold text-foreground">Survey Data</h1>
        <p className="text-xs md:text-sm text-muted-foreground font-mono mt-1">COORDINATE INPUT · LAYER MANAGEMENT · DWG EXPORT</p>
      </motion.div>

      {/* Source & Controls */}
      <motion.div
        className="bg-card rounded-lg border border-border p-4 md:p-5 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 md:gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="font-mono text-xs text-muted-foreground uppercase">Source:</span>
        </div>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-full sm:w-48 font-mono text-sm bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="total-station">Total Station</SelectItem>
            <SelectItem value="dgps">DGPS</SelectItem>
            <SelectItem value="drone">Survey Drone</SelectItem>
            <SelectItem value="manual">Manual Entry</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
          <Button variant="outline" size="sm" className="font-mono text-xs gap-2 flex-1 sm:flex-initial">
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm" className="font-mono text-xs gap-2 flex-1 sm:flex-initial">
            <Download className="w-3.5 h-3.5" />
            Export DWG
          </Button>
        </div>
      </motion.div>

      {/* Data Table */}
      <motion.div
        className="bg-card rounded-lg border border-border overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="p-4 md:p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="font-mono text-xs md:text-sm font-semibold text-foreground">POINT DATA</h2>
            <span className="font-mono text-[10px] md:text-xs text-muted-foreground ml-2">({points.length} points)</span>
          </div>
          <Button size="sm" onClick={addPoint} className="font-mono text-xs gap-2">
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Point</span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {["PT #", "EASTING (E)", "NORTHING (N)", "ELEVATION (Z)", "CODE", "LAYER", ""].map((h) => (
                  <th key={h} className="px-3 md:px-4 py-3 text-left text-[10px] md:text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {points.map((pt) => (
                <tr key={pt.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="px-3 md:px-4 py-2">
                    <Input value={pt.pointNo} onChange={(e) => updatePoint(pt.id, "pointNo", e.target.value)} className="w-14 md:w-16 h-8 font-mono text-xs bg-secondary border-border" />
                  </td>
                  <td className="px-3 md:px-4 py-2">
                    <Input value={pt.easting} onChange={(e) => updatePoint(pt.id, "easting", e.target.value)} className="w-28 md:w-32 h-8 font-mono text-xs bg-secondary border-border" placeholder="0.000" />
                  </td>
                  <td className="px-3 md:px-4 py-2">
                    <Input value={pt.northing} onChange={(e) => updatePoint(pt.id, "northing", e.target.value)} className="w-28 md:w-32 h-8 font-mono text-xs bg-secondary border-border" placeholder="0.000" />
                  </td>
                  <td className="px-3 md:px-4 py-2">
                    <Input value={pt.elevation} onChange={(e) => updatePoint(pt.id, "elevation", e.target.value)} className="w-24 md:w-28 h-8 font-mono text-xs bg-secondary border-border" placeholder="0.000" />
                  </td>
                  <td className="px-3 md:px-4 py-2">
                    <Input value={pt.code} onChange={(e) => updatePoint(pt.id, "code", e.target.value)} className="w-16 md:w-20 h-8 font-mono text-xs bg-secondary border-border" placeholder="Code" />
                  </td>
                  <td className="px-3 md:px-4 py-2">
                    <Select value={pt.layer} onValueChange={(v) => updatePoint(pt.id, "layer", v)}>
                      <SelectTrigger className="w-24 md:w-28 h-8 font-mono text-xs bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {defaultLayers.map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 md:px-4 py-2">
                    <button onClick={() => removePoint(pt.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
