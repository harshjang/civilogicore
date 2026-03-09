import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MapPin, Upload, Plus, Trash2, Download, Layers, Save, FileText, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SaveToDocumentsDialog from "@/components/survey/SaveToDocumentsDialog";

interface SurveyPoint {
  id: string;
  pointNo: string;
  easting: string;
  northing: string;
  elevation: string;
  code: string;
  layer: string;
  isNew?: boolean;
  isDirty?: boolean;
}

const defaultLayers = ["Boundary", "Centerline", "Contour", "Structure", "Road", "Drainage", "Utility"];

export default function SurveyData() {
  const { user } = useAuth();
  const [source, setSource] = useState("total-station");
  const [points, setPoints] = useState<SurveyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load points from DB
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("survey_points")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        toast.error("Failed to load survey points");
        console.error(error);
      } else {
        setPoints(
          (data || []).map((p: any) => ({
            id: p.id,
            pointNo: p.point_no,
            easting: String(p.easting),
            northing: String(p.northing),
            elevation: String(p.elevation),
            code: p.code,
            layer: p.layer,
          }))
        );
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const addPoint = () => {
    const newId = crypto.randomUUID();
    const no = String(points.length + 1);
    setPoints([...points, { id: newId, pointNo: no, easting: "", northing: "", elevation: "", code: "", layer: "Boundary", isNew: true }]);
  };

  const removePoint = async (id: string) => {
    const pt = points.find((p) => p.id === id);
    if (pt && !pt.isNew) {
      const { error } = await supabase.from("survey_points").delete().eq("id", id);
      if (error) { toast.error("Failed to delete point"); return; }
    }
    setPoints(points.filter((p) => p.id !== id));
    toast.success("Point removed");
  };

  const updatePoint = (id: string, field: keyof SurveyPoint, value: string) => {
    setPoints(points.map((p) => (p.id === id ? { ...p, [field]: value, isDirty: true } : p)));
  };

  const saveAll = async () => {
    if (!user) return;
    const newPts = points.filter((p) => p.isNew);
    const dirtyPts = points.filter((p) => p.isDirty && !p.isNew);

    const inserts = newPts.map((p) => ({
      id: p.id,
      user_id: user.id,
      point_no: p.pointNo,
      easting: parseFloat(p.easting) || 0,
      northing: parseFloat(p.northing) || 0,
      elevation: parseFloat(p.elevation) || 0,
      code: p.code,
      layer: p.layer,
      source,
    }));

    if (inserts.length > 0) {
      const { error } = await supabase.from("survey_points").insert(inserts);
      if (error) { toast.error("Failed to save new points"); console.error(error); return; }
    }

    for (const p of dirtyPts) {
      const { error } = await supabase.from("survey_points").update({
        point_no: p.pointNo,
        easting: parseFloat(p.easting) || 0,
        northing: parseFloat(p.northing) || 0,
        elevation: parseFloat(p.elevation) || 0,
        code: p.code,
        layer: p.layer,
        source,
      }).eq("id", p.id);
      if (error) { toast.error("Failed to update point"); console.error(error); return; }
    }

    setPoints(points.map((p) => ({ ...p, isNew: false, isDirty: false })));
    toast.success("All points saved!");
  };

  // Import CSV
  const handleImportCSV = () => fileInputRef.current?.click();

  const processCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n");
      const newPoints: SurveyPoint[] = [];

      for (let i = 0; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        if (cols.length < 3) continue;
        // Skip header row
        if (i === 0 && isNaN(parseFloat(cols[0])) && isNaN(parseFloat(cols[1]))) continue;

        newPoints.push({
          id: crypto.randomUUID(),
          pointNo: cols[0] || String(points.length + newPoints.length + 1),
          easting: cols[1] || "0",
          northing: cols[2] || "0",
          elevation: cols[3] || "0",
          code: cols[4] || "",
          layer: cols[5] || "Boundary",
          isNew: true,
        });
      }

      setPoints([...points, ...newPoints]);
      toast.success(`Imported ${newPoints.length} points from CSV`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Export DXF
  const exportDXF = () => {
    if (points.length === 0) { toast.error("No points to export"); return; }

    let dxf = "0\nSECTION\n2\nENTITIES\n";
    for (const pt of points) {
      const x = parseFloat(pt.easting) || 0;
      const y = parseFloat(pt.northing) || 0;
      const z = parseFloat(pt.elevation) || 0;
      // POINT entity
      dxf += `0\nPOINT\n8\n${pt.layer}\n10\n${x}\n20\n${y}\n30\n${z}\n`;
      // TEXT entity for label
      dxf += `0\nTEXT\n8\n${pt.layer}\n10\n${x + 0.5}\n20\n${y + 0.5}\n30\n${z}\n40\n0.5\n1\n${pt.pointNo}\n`;
    }
    dxf += "0\nENDSEC\n0\nEOF\n";

    const blob = new Blob([dxf], { type: "application/dxf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "survey_export.dxf";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("DXF file exported!");
  };

  return (
    <div className="p-4 md:p-8 space-y-6 pt-14 md:pt-8">
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={processCSV} />

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl md:text-2xl font-mono font-bold text-foreground">Survey Data</h1>
        <p className="text-xs md:text-sm text-muted-foreground font-mono mt-1">COORDINATE INPUT · LAYER MANAGEMENT · DXF EXPORT</p>
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

        <div className="flex gap-2 w-full sm:w-auto sm:ml-auto flex-wrap">
          <Button variant="outline" size="sm" className="font-mono text-xs gap-2 flex-1 sm:flex-initial" onClick={handleImportCSV}>
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm" className="font-mono text-xs gap-2 flex-1 sm:flex-initial" onClick={exportDXF}>
            <Download className="w-3.5 h-3.5" />
            Export DXF
          </Button>
          <Button size="sm" className="font-mono text-xs gap-2 flex-1 sm:flex-initial" onClick={saveAll}>
            <Save className="w-3.5 h-3.5" />
            Save All
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

        {loading ? (
          <div className="p-8 text-center">
            <p className="font-mono text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : points.length === 0 ? (
          <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center">
            <MapPin className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="font-mono text-sm text-muted-foreground">No survey points yet</p>
            <p className="font-mono text-xs text-muted-foreground/60 mt-1">Add points manually or import a CSV file</p>
          </div>
        ) : (
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
        )}
      </motion.div>
    </div>
  );
}
