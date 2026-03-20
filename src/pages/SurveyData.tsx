import WorkspaceSidebar from "@/components/ui/WorkspaceSidebar";
import WorkspaceToolbar from "@/components/ui/WorkspaceToolbar";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { generateAlignment } from "@/lib/road/alignment";
import { generateVerticalProfile } from "@/lib/road/verticalProfile";
import { generateCrossSections } from "@/lib/road/crossSection";
import { generateCorridor } from "@/lib/road/corridor";
import { orderPoints } from "@/lib/survey/orderPoints";
import { generateRoadProfile } from "@/lib/survey/generateRoadProfile";
import RoadProfileChart from "@/components/survey/RoadProfileChart";
import { lazy, Suspense } from "react";
const TerrainViewer = lazy(() => import("@/components/survey/TerrainViewer"));
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Upload, Plus, Trash2, Download, Layers, Save, FileText, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SaveToDocumentsDialog from "@/components/survey/SaveToDocumentsDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { polygonArea } from "@/lib/survey/calcArea";
import { aiConstructionEstimator } from "@/lib/survey/aiConstructionEstimator";

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
const defaultCodes = ["BM", "CP", "TP", "IP", "MH", "LP", "EP", "FH", "PP", "WV", "SV", "GND", "TBM", "PEG", "TREE", "BLDG", "FENCE", "WALL", "CURB", "INV"];

export default function SurveyData() {
  const { user } = useAuth();
  const location = useLocation();
  const [source, setSource] = useState("total-station");
  const [points, setPoints] = useState<SurveyPoint[]>([]);
  const [profile,setProfile] = useState<any[]>([]);
  const [editPlots,setEditPlots] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [earthwork, setEarthwork] = useState<{cut:number,fill:number,net:number} | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadedDocName, setLoadedDocName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [estimate,setEstimate]=useState<any>(null);
  const [simulation,setSimulation] = useState(false);
  const [twinStatus,setTwinStatus] = useState<any>(null);
  const [advancedMode,setAdvancedMode] = useState(false);
  const [alignment,setAlignment] = useState<any[]>([]);
  const [sections,setSections] = useState<any[]>([]);
  const [corridor,setCorridor] = useState<any[]>([]);
  const [verticalProfile,setVerticalProfile] = useState<any[]>([]);
  const { activeTool, drawMode, setDrawMode } = useWorkspace();
  const [THREE, setTHREE] = useState<any>(null);
  const [OrbitControls, setOrbitControls] = useState<any>(null);

  useEffect(() => {
  const loadThree = async () => {
    const THREE_mod = await import("three");
    const controls_mod = await import("three/examples/jsm/controls/OrbitControls.js");

    setTHREE(THREE_mod);
    setOrbitControls(() => controls_mod.OrbitControls);
  };

  loadThree();
}, []);

  // Load points from DB (skip if CSV was passed via navigation)
  useEffect(() => {
    const state = location.state as { csvContent?: string } | null;
    if (!user || state?.csvContent) return;
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

  // Load CSV from Documents navigation
  useEffect(() => {
    const state = location.state as { csvContent?: string; docName?: string } | null;
    if (!state?.csvContent) return;

    const lines = state.csvContent.trim().split("\n");
    const parsed: SurveyPoint[] = [];

    for (let i = 0; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      if (cols.length < 3) continue;
      if (i === 0 && isNaN(parseFloat(cols[0])) && isNaN(parseFloat(cols[1]))) continue;

      parsed.push({
        id: crypto.randomUUID(),
        pointNo: cols[0] || String(parsed.length + 1),
        easting: cols[1] || "0",
        northing: cols[2] || "0",
        elevation: cols[3] || "0",
        code: cols[4] || "",
        layer: cols[5] || "Boundary",
        isNew: true,
      });
    }

    if (parsed.length > 0) {
      setPoints(parsed);
      setLoadedDocName(state.docName || null);
      setLoading(false);
      toast.success(`Loaded ${parsed.length} points from ${state.docName || "CSV"}`);
    }
    // Clear state to prevent re-loading on re-render
    window.history.replaceState({}, document.title);
  }, [location.state]);

  useEffect(()=>{
 if(points.length < 2) return

 const ordered = orderPoints(points)
 const prof = generateRoadProfile(ordered)

 setProfile(prof)
},[points])

  // Live Total Station Listener
useEffect(() => {

  if (!liveMode) return;

  const ws = new WebSocket(import.meta.env.VITE_WS_URL);

  ws.onopen = () => {
    console.log("Connected to Total Station server");
  };

  ws.onmessage = (msg) => {

    const data = msg.data.split(",");

    if (data.length < 3) return;

    const newPoint: SurveyPoint = {
      id: crypto.randomUUID(),
      pointNo: data[0] || String(points.length + 1),
      easting: data[1] || "0",
      northing: data[2] || "0",
      elevation: data[3] || "0",
      code: "",
      layer: "Boundary",
      isNew: true
    };

    setPoints(prev => [...prev, newPoint]);

    toast.success("Live point received from Total Station");

  };

  ws.onerror = () => {
    console.log("Total Station connection error");
  };

  return () => {
    ws.close();
  };

}, [liveMode]);

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

  useEffect(() => {

 if(points.length < 3) return

 const area = polygonArea(points)

 toast.success(`Area = ${area.toFixed(2)} sq.m`)

},[points])

useEffect(() => {

  if (!activeTool) return;

  if (activeTool === "alignment") {
    setDrawMode(true);
    toast.success("Click on terrain to draw alignment");
  }

  if (activeTool === "sections") {
    const s = generateCrossSections(points);
    setSections(s);
    toast.success("Cross sections generated");
  }

  if (activeTool === "profile") {
    const vp = generateVerticalProfile(points);
    setVerticalProfile(vp);
    toast.success("Vertical profile generated");
  }

  if (activeTool === "corridor") {
    if (alignment.length === 0) {
      toast.error("Generate alignment first");
      return;
    }
    const c = generateCorridor(alignment);
    setCorridor(c);
    toast.success("Corridor generated");
  }

  if (activeTool === "estimate") {
    setEstimate(aiConstructionEstimator(points));
  }

  if (activeTool === "simulation") {
    setSimulation(true);
  }

}, [activeTool]);

  // Export DXF
  const contourInterval = 1; // meters
const exportDXF = () => {
  if (points.length === 0) {
    toast.error("No points to export");
    return;
  }

  const labelOffset = 1.0;

  let dxf = "";

  // DXF HEADER
  dxf += "0\nSECTION\n2\nHEADER\n0\nENDSEC\n";

  // LAYER TABLE
  dxf += "0\nSECTION\n2\nTABLES\n";
  dxf += "0\nTABLE\n2\nLAYER\n70\n1\n";

  // Layer color mapping (AutoCAD color index)
  const layerColors: Record<string, number> = {
    Boundary: 1,    // red
    Centerline: 2,  // yellow
    Contour: 3,     // green
    Structure: 4,   // cyan
    Road: 5,        // blue
    Drainage: 6,    // magenta
    Utility: 140    // orange
  };

  const uniqueLayers = Array.from(new Set(points.map(p => p.layer)));

  for (const layer of uniqueLayers) {

  const color = layerColors[layer] || 7; // default white

  dxf += `
0
LAYER
2
${layer}
70
0
62
${color}
6
CONTINUOUS
`;

}

  dxf += "0\nENDTAB\n0\nENDSEC\n";

  // ENTITIES SECTION
  dxf += "0\nSECTION\n2\nENTITIES\n";

  for (const pt of points) {
    const x = parseFloat(pt.easting) || 0;
    const y = parseFloat(pt.northing) || 0;
    const z = parseFloat(pt.elevation) || 0;

    // POINT ENTITY
dxf += `
0
POINT
8
${pt.layer}
10
${x}
20
${y}
30
${z}
`;

// SYMBOL BASED ON CODE
const code = pt.code?.toUpperCase();

if (code === "MH") {

  // Manhole → circle
  dxf += `
0
CIRCLE
8
${pt.layer}
10
${x}
20
${y}
30
${z}
40
0.7
`;

}

else if (code === "TREE") {

  // Tree → bigger circle
  dxf += `
0
CIRCLE
8
${pt.layer}
10
${x}
20
${y}
30
${z}
40
1.0
`;

}

else if (code === "LP" || code === "POLE") {

  // Pole → cross
  dxf += `
0
LINE
8
${pt.layer}
10
${x - 0.5}
20
${y - 0.5}
30
${z}
11
${x + 0.5}
21
${y + 0.5}
31
${z}
`;

  dxf += `
0
LINE
8
${pt.layer}
10
${x - 0.5}
20
${y + 0.5}
30
${z}
11
${x + 0.5}
21
${y - 0.5}
31
${z}
`;

}

else if (code === "BM" || code === "CP") {

  // Benchmark → square
  const s = 0.6;

  dxf += `
0
LWPOLYLINE
8
${pt.layer}
90
4
70
1
10
${x - s}
20
${y - s}
10
${x + s}
20
${y - s}
10
${x + s}
20
${y + s}
10
${x - s}
20
${y + s}
`;

}

    // TEXT LABEL
    dxf += `0
TEXT
8
${pt.layer}
10
${x + labelOffset}
20
${y + labelOffset}
30
${z}
40
0.5
1
${pt.pointNo}
`;
  }

  // BOUNDARY POLYLINE (connects points)
  if (points.length > 1) {
    dxf += `0
LWPOLYLINE
8
Boundary
90
${points.length}
70
1
`;
    const ordered = orderPoints(points);
    for (const pt of ordered) {
      const x = parseFloat(pt.easting) || 0;
      const y = parseFloat(pt.northing) || 0;

      dxf += `10
${x}
20
${y}
`;
    }
  }

  const elevations = points.map(p => parseFloat(p.elevation) || 0);

const minZ = Math.min(...elevations);
const maxZ = Math.max(...elevations);

  const contourLevels = [];

for (
  let z = Math.ceil(minZ / contourInterval) * contourInterval;
  z <= maxZ;
  z += contourInterval
) {
  contourLevels.push(z);
}

  for (const level of contourLevels) {

  const contourPoints = [];

  for (let i = 0; i < points.length - 1; i++) {

    const p1 = points[i];
    const p2 = points[i + 1];

    const z1 = parseFloat(p1.elevation) || 0;
    const z2 = parseFloat(p2.elevation) || 0;

    if ((z1 <= level && z2 >= level) || (z2 <= level && z1 >= level)) {

      const x1 = parseFloat(p1.easting);
      const y1 = parseFloat(p1.northing);

      const x2 = parseFloat(p2.easting);
      const y2 = parseFloat(p2.northing);

      const t = (level - z1) / (z2 - z1);

      const x = x1 + t * (x2 - x1);
      const y = y1 + t * (y2 - y1);

      contourPoints.push({ x, y });
    }
  }

  if (contourPoints.length >= 2) {

    dxf += `
0
LWPOLYLINE
8
Contour
90
${contourPoints.length}
`;

    for (const pt of contourPoints) {
      dxf += `
10
${pt.x}
20
${pt.y}
`;
    }

  }

  // Add contour label
if (contourPoints.length > 0) {

  const mid = contourPoints[Math.floor(contourPoints.length / 2)];

  dxf += `
0
TEXT
8
Contour
10
${mid.x}
20
${mid.y}
30
0
40
1
1
${level}
`;
}

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

<div className="flex">

  <WorkspaceSidebar />

  <div className="flex-1">

    <WorkspaceToolbar />

    <div className="p-4 md:p-8 space-y-6 pt-14 md:pt-8">
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={processCSV} />

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl md:text-2xl font-mono font-bold text-foreground">Survey Data</h1>
        <p className="text-xs md:text-sm text-muted-foreground font-mono mt-1">
          COORDINATE INPUT · LAYER MANAGEMENT · DXF EXPORT
          {loadedDocName && <span className="text-primary ml-2">· Loaded: {loadedDocName}</span>}
        </p>
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
          <Button variant="outline" size="sm" className="font-mono text-xs gap-2 flex-1 sm:flex-initial" onClick={() => setSaveDialogOpen(true)} disabled={points.length === 0}>
            <FileText className="w-3.5 h-3.5" />
            Save to Docs
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="font-mono text-xs gap-2 flex-1 sm:flex-initial">
                <FilePlus className="w-3.5 h-3.5" />
                New Plot
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Start New Plot?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all current survey points. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={async () => {
                  if (!user) return;
                  const dbPoints = points.filter(p => !p.isNew);
                  if (dbPoints.length > 0) {
                    const { error } = await supabase.from("survey_points").delete().eq("user_id", user.id);
                    if (error) { toast.error("Failed to clear points"); console.error(error); return; }
                  }
                  setPoints([]);
                  toast.success("Ready for new plot entries");
                }}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
    variant={liveMode ? "default" : "outline"}
    size="sm"
    className="font-mono text-xs gap-2 flex-1 sm:flex-initial"
    onClick={() => setLiveMode(!liveMode)}
  >
  <MapPin className="w-3.5 h-3.5" />
  {liveMode ? "Live ON" : "Live OFF"}
  </Button>

  <Button
 size="sm"
 variant={editPlots ? "default":"outline"}
 className="font-mono text-xs flex-1 sm:flex-initial"
 onClick={()=>setEditPlots(!editPlots)}
>
 Edit Plots
</Button>

        </div>
      </motion.div>

</div>

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
                      <Select value={pt.code || undefined} onValueChange={(v) => updatePoint(pt.id, "code", v)}>
                        <SelectTrigger className="w-20 md:w-24 h-8 font-mono text-xs bg-secondary border-border">
                          <SelectValue placeholder="Code" />
                        </SelectTrigger>
                        <SelectContent>
                          {defaultCodes.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

      {/* Terrain Viewer */}
{points.length > 2 && (
  <div className="bg-card rounded-lg border border-border p-4 md:p-5">
    <h2 className="font-mono text-sm font-semibold mb-3">
      3D Terrain Preview
    </h2>

    <Suspense fallback={<div className="text-xs font-mono">Loading 3D...</div>}>
  <TerrainViewer
    points={points}
    alignment={alignment}
    sections={sections}
    corridor={corridor}
    verticalProfile={verticalProfile}
    drawMode={drawMode}
    setAlignment={setAlignment}
    setDrawMode={setDrawMode}
    setEarthwork={setEarthwork}
    editPlots={editPlots}
    setEstimate={setEstimate}
    simulation={simulation}
    setTwinStatus={setTwinStatus}
  />
</Suspense>
  </div>
)}

  {earthwork && (
  <div className="bg-card rounded-lg border border-border p-4 md:p-5">
    <h2 className="font-mono text-sm font-semibold mb-3">
      Earthwork Volume
    </h2>

    <p className="font-mono text-xs">
      Cut: {earthwork.cut.toFixed(2)} m³
    </p>

    <p className="font-mono text-xs">
      Fill: {earthwork.fill.toFixed(2)} m³
    </p>

    <p className="font-mono text-xs">
      Net: {earthwork.net.toFixed(2)} m³
    </p>
  </div>
)}

      {profile.length>0 && (

 <div className="bg-card border border-border rounded-lg p-4 md:p-5">

  <h2 className="font-mono text-sm font-semibold mb-3">
   Road Profile
  </h2>

  <RoadProfileChart profile={profile}/>

 </div>

)}

{estimate && (

 <div className="bg-card border border-border rounded-lg p-4 md:p-5">

  <h2 className="font-mono text-sm font-semibold mb-3">
   AI Construction Estimate
  </h2>

  <p className="font-mono text-xs">
   Road Length: {estimate.roadLength.toFixed(2)} m
  </p>

  <p className="font-mono text-xs">
   Building Area: {estimate.buildingArea.toFixed(2)} m²
  </p>

  <p className="font-mono text-xs">
   Water Line: {estimate.waterLength.toFixed(2)} m
  </p>

  <p className="font-mono text-xs">
   Sewer Line: {estimate.sewerLength.toFixed(2)} m
  </p>

  <p className="font-mono text-xs">
   Estimated Cost: ${estimate.totalCost.toFixed(2)}
  </p>

 </div>

)}
{twinStatus && (

 <div className="bg-card border border-border rounded-lg p-4 md:p-5">

  <h2 className="font-mono text-sm font-semibold mb-3">
   Digital Twin Monitoring
  </h2>

  <p className="font-mono text-xs">
   Planned Elements: {twinStatus.plannedProgress}
  </p>

  <p className="font-mono text-xs">
   Completed Elements: {twinStatus.actualProgress}
  </p>

  <p className="font-mono text-xs">
   Delay: {twinStatus.delay}
  </p>

  <p className="font-mono text-xs">
   Status: {twinStatus.status}
  </p>

 </div>

)}

      {/* Save to Documents Dialog */}
      {user && (
        <SaveToDocumentsDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          points={points}
          userId={user.id}
        />
      )}
    </div>
    </div>
  );
}
