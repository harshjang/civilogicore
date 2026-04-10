import { savePointsLocal } from "@/lib/offline/saveLocal";
import { loadPointsLocal } from "@/lib/offline/loadLocal";
import { syncPoints } from "@/lib/offline/sync";

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
import { MapPin, Upload, Plus, Trash2, Download, Layers, Save, FileText, FilePlus, MoreVertical, Settings2, Radio, Pencil, ChevronDown, Undo2, Redo2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SaveToDocumentsDialog from "@/components/survey/SaveToDocumentsDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useHistory } from "@/lib/history/useHistory";
import { canEdit } from "@/lib/auth/roles";

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
  const [role, setRole] = useState<string>("viewer");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [presenceState, setPresenceState] = useState<any>({});
  const {
    state: points,
    set: setPoints,
    undo,
    redo,
    canUndo,
    canRedo,
    history
  } = useHistory<SurveyPoint[]>([]);
  const [profile, setProfile] = useState<any[]>([]);
  const [editPlots, setEditPlots] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [earthwork, setEarthwork] = useState<{ cut: number, fill: number, net: number } | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadedDocName, setLoadedDocName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [estimate, setEstimate] = useState<any>(null);
  const [simulation, setSimulation] = useState(false);
  const [twinStatus, setTwinStatus] = useState<any>(null);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [alignment, setAlignment] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [corridor, setCorridor] = useState<any[]>([]);
  const [verticalProfile, setVerticalProfile] = useState<any[]>([]);
  const { activeTool, drawMode, setDrawMode } = useWorkspace();
  const [projects, setProjects] = useState<any[]>([]);
  const [leftWidth, setLeftWidth] = useState(320);
  const [bottomHeight, setBottomHeight] = useState(120);
  const isResizingLeft = useRef(false);
  const isResizingBottom = useRef(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [command, setCommand] = useState("");
  const [activeModule, setActiveModule] = useState("Survey");

  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>(
    Object.fromEntries(defaultLayers.map(l => [l, true]))
  );

  const [activeLayer, setActiveLayer] = useState("Boundary");
  const runCommand = () => {
    const cmd = command.toLowerCase();

    if (cmd === "add") addPoint();
    else if (cmd === "save") saveAll();
    else if (cmd === "export") exportDXF();
    else if (cmd === "undo") undo();
    else if (cmd === "redo") redo();
    else if (cmd === "clear") setPoints([]);
    else toast.error("Unknown command");

    setCommand("");
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (isResizingLeft.current) setLeftWidth(prev => Math.max(260, e.clientX));
      if (isResizingBottom.current)
        setBottomHeight(prev => Math.max(80, window.innerHeight - e.clientY));
    };

    const stop = () => {
      isResizingLeft.current = false;
      isResizingBottom.current = false;
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
    };
  }, []);

  useEffect(() => {
    if (points.length === 0) return;

    const timer = setTimeout(() => {
      savePointsLocal(points);
      console.log("Auto-saved locally");
    }, 1000);

    return () => clearTimeout(timer);
  }, [points]);

  useEffect(() => {
    const loadOffline = async () => {
      const local = await loadPointsLocal();

      if (local.length > 0) {
        setPoints(local);
        console.log("Loaded offline data");
      }
    };

    loadOffline();
  }, []);

  useEffect(() => {
    const loadProjects = async () => {
      const { data } = await (supabase as any)
        .from("project_members")
        .select("role")
        .eq("user_id", user.id)
        .eq("project_id", projectId)
        .single();
      setProjects(data || []);
    };

    loadProjects();
  }, []);

  useEffect(() => {
  const handleOnline = () => {
    if (user && projectId) {
      syncPoints(user.id, projectId);
      toast.success("Synced with server");
    }
  };

  window.addEventListener("online", handleOnline);
  return () => window.removeEventListener("online", handleOnline);
}, [user, projectId]);

  useEffect(() => {
  const handler = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = "";
    }
  };

  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}, [hasUnsavedChanges]);

useEffect(() => {
  const dirty = points.some(p => p.isNew || p.isDirty);
  setHasUnsavedChanges(dirty);
}, [points]);

useEffect(() => {
  if (!hasUnsavedChanges) return;

  const timer = setTimeout(async () => {
    try {
      // 1. Save locally first (offline safety)
      savePointsLocal(points);

      // 2. Save to DB if online
      if (user) {
        await saveAll(); // your existing function
      }

      toast.success("Auto-saved");
    } catch (err) {
      console.error(err);
      toast.error("Auto-save failed");
    }
  }, 2000); // 2 sec debounce

  return () => clearTimeout(timer);
}, [points]);

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
  }, [user, projectId]);

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {

      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        undo();
      }

      if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeys);

    return () => window.removeEventListener("keydown", handleKeys);
  }, [undo, redo]);

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

  useEffect(() => {
    if (points.length < 2) return

    const ordered = orderPoints(points)
    const prof = generateRoadProfile(ordered)

    setProfile(prof)
  }, [points])

  // Live Total Station Listener
  useEffect(() => {

    if (!liveMode) return;

    if (!import.meta.env.VITE_WS_URL) return;

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

      toast.success("Live point received from Total Station");

      setPoints([...points, newPoint]);

    };

    ws.onerror = () => {
      console.log("Total Station connection error");
    };

    return () => {
      ws.close();
    };

  }, [liveMode]);

  const addPoint = () => {
    if (!canEdit(role)) {
      toast.error("No edit permission");
      return;
    }

    setPoints([
      ...points,
      {
        id: crypto.randomUUID(),
        pointNo: String(points.length + 1),
        easting: "",
        northing: "",
        elevation: "",
        code: "",
        layer: activeLayer,
        isNew: true
      }
    ]);
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
    if (!user) {
      toast.error("Login required");
      return;
    }

    if (points.length === 0) {
      toast.error("No points to save");
      return;
    }
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
  const handleImportCSV = () => {
    if (!fileInputRef.current) {
      toast.error("File input not ready");
      return;
    }
    fileInputRef.current.click();
  };

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

    if (points.length < 3) return

    const area = polygonArea(points)

    toast.success(`Area = ${area.toFixed(2)} sq.m`)

  }, [points])

  useEffect(() => {
  const dirty = points.some(p => p.isNew || p.isDirty);
  setHasUnsavedChanges(dirty);
}, [points]);

useEffect(() => {
  if (!hasUnsavedChanges) return;

  const timer = setTimeout(async () => {
    try {
      // 1. Save locally first (offline safety)
      savePointsLocal(points);

      // 2. Save to DB if online
      if (user) {
        await saveAll(); // your existing function
      }

      toast.success("Auto-saved");
    } catch (err) {
      console.error(err);
      toast.error("Auto-save failed");
    }
  }, 2000); // 2 sec debounce

  return () => clearTimeout(timer);
}, [points]);

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

  useEffect(() => {

    const channel = supabase
      .channel("survey-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "survey_points",
        },
        (payload) => {

          if (!payload.new && payload.eventType !== "DELETE") return;
          if (!payload.old && payload.eventType === "DELETE") return;

          console.log("Realtime update:", payload);

          const mapDbToPoint = (row: any): SurveyPoint => ({
            id: row.id,
            pointNo: row.point_no,
            easting: String(row.easting),
            northing: String(row.northing),
            elevation: String(row.elevation),
            code: row.code,
            layer: row.layer,
          });

          if (payload.eventType === "INSERT") {
            const newRow = payload.new as any;

            const exists = points.find(p => p.id === newRow.id);

            if (!exists) {
              setPoints([...points, mapDbToPoint(newRow)]);
            }
          }

          if (payload.eventType === "UPDATE") {
            const newRow = payload.new as any;

            setPoints(
              points.map(p =>
                p.id === newRow.id ? mapDbToPoint(newRow) : p
              )
            );
          }

          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as any;

            setPoints(
              points.filter(p => p.id !== oldRow.id)
            );
          }

        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, []);

  useEffect(() => {

    if (!user) return;

    const channel = supabase.channel("presence", {
      config: { presence: { key: user.id } },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      setPresenceState(state);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user: user?.email,
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };

  }, [user, projectId]);

  useEffect(() => {
    if (!user || !projectId) return;

    const loadRole = async () => {
      type ProjectMember = {
        role: string;
      };

      const { data, error } = await (supabase as any)
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .eq("project_id", projectId)
        .single();

      if (data) setRole((data as ProjectMember).role);
    };

    loadRole();
  }, [user, projectId]);

  useEffect(() => {
  const handler = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = "";
    }
  };

  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}, [hasUnsavedChanges]);

  // Export DXF
  const contourInterval = 1; // meters
  const exportDXF = () => {
    if (points.length === 0) {
      toast.error("No points to export");
      return;
    }

    if (!canEdit(role)) {
      toast.error("No edit permission");
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
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 relative overflow-auto p-3 md:p-6 space-y-3 pt-14 md:pt-6">
        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={processCSV} />

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-mono font-bold text-foreground tracking-wider">
              Survey Data
            </h1>
            <p className="text-xs md:text-xs text-muted-foreground font-mono mt-0.5 tracking-wide">
              COORDINATE INPUT · LAYER MANAGEMENT · DXF EXPORT
              {loadedDocName && <span className="text-primary ml-2">· {loadedDocName}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              {loadedDocName && <span className="text-primary">{loadedDocName}</span>}
            </span>
          </div>
        </motion.div>

        {/* Module Tabs */}
        <div className="flex items-center gap-1.5 border-b border-border pb-2">
          {["Survey", "Terrain", "Road", "Hydrology", "Utilities", "AI"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveModule(tab)}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all ${
                activeModule === tab
                  ? "bg-primary text-primary-foreground shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Toolbar — compact row of dropdown groups + source selector */}
        <motion.div
          className="flex flex-wrap items-center gap-1.5"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          {/* Source */}
          <div className="flex items-center gap-1.5 mr-1">
            <MapPin className="w-3 h-3 text-primary" />
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="w-32 h-7 font-mono text-xs bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total-station">Total Station</SelectItem>
                <SelectItem value="dgps">DGPS</SelectItem>
                <SelectItem value="drone">Survey Drone</SelectItem>
                <SelectItem value="manual">Manual Entry</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-px h-5 bg-border" />

          {/* Data dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2 font-mono text-xs gap-1">
                <FileText className="w-3 h-3" /> Data <ChevronDown className="w-2.5 h-2.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="font-mono text-xs">
              <DropdownMenuItem onClick={handleImportCSV}>Import CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={exportDXF}>Export DXF</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSaveDialogOpen(true)}>Save to Documents</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mode dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2 font-mono text-xs gap-1">
                <Settings2 className="w-3 h-3" /> Mode <ChevronDown className="w-2.5 h-2.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="font-mono text-xs">
              <DropdownMenuItem onClick={() => { setLiveMode(!liveMode); toast.success(`Live ${!liveMode ? "enabled" : "disabled"}`); }}>
                {liveMode ? "● Live ON" : "○ Live OFF"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setEditPlots(!editPlots); toast.success("Edit mode toggled"); }}>
                {editPlots ? "● Edit Plots ON" : "○ Edit Plots OFF"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Project dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2 font-mono text-xs gap-1">
                <Layers className="w-3 h-3" /> Project <ChevronDown className="w-2.5 h-2.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="font-mono text-xs min-w-[200px]">
              <div className="p-2">
                <Select onValueChange={(val) => setProjectId(val || null)}>
                  <SelectTrigger className="w-full h-7 font-mono text-xs">
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={!projectId} onClick={() => {
                if (!user) return toast.error("Login required");
                if (!projectId) return toast.error("Select a project");
                syncPoints(user.id, projectId);
                toast.success("Sync started");
              }}>
                Sync Now
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-5 bg-border" />

          {/* Undo / Redo / Clear */}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={undo} disabled={!canUndo} title="Undo">
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={redo} disabled={!canRedo} title="Redo">
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2 font-mono text-xs gap-1" disabled={!canEdit(role)}>
                <XCircle className="w-3 h-3" /> Clear
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all points?</AlertDialogTitle>
                <AlertDialogDescription>This will remove all survey points from the workspace. This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { setPoints([]); toast.success("All points cleared"); }}>Clear</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Spacer + Saved status */}
          <div className="flex-1" />
          <div className="text-xs font-mono">
            {hasUnsavedChanges ? (
              <span className="text-destructive">● Unsaved</span>
            ) : (
              <span className="text-primary">● Saved</span>
            )}
          </div>
        </motion.div>

        {activeModule === "Survey" && (
          <>
            {/* Data Table */}
            <motion.div
              className="bg-card border border-border rounded-xl backdrop-blur-md shadow-sm hover:shadow-md transition glow-cyan overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="p-4 md:p-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <h2 className="font-mono text-xs md:text-sm font-semibold text-foreground">POINT DATA</h2>
                  <span className="font-mono text-xs md:text-xs text-muted-foreground ml-2">({points.length} points)</span>
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
                          <th key={h} className="px-3 md:px-4 py-3 text-left text-xs md:text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {points
                        .filter(p => layerVisibility[p.layer])
                        .map((pt) => (
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
          </>
        )}

        {/* Terrain Viewer */}
        {activeModule === "Terrain" && points.length > 2 && (
          <>
            <div className="h-[70vh] bg-black border border-border rounded-xl overflow-hidden flex flex-col">

              <div className="px-3 py-2 text-xs font-mono text-muted-foreground border-b border-border">
                3D TERRAIN VIEW
              </div>

              <div className="flex-1">
                <Suspense fallback={<div className="text-xs font-mono p-2">Loading 3D...</div>}>
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

            </div>
            {earthwork && (
              <div className="bg-card border border-border rounded-xl backdrop-blur-md shadow-sm hover:shadow-md transition glow-cyan p-4 md:p-5">
                <h2 className="text-sm font-semibold text-foreground tracking-wide mb-3">
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
          </>
        )}

        {activeModule === "AI" && estimate && (

          <div className="bg-card border border-border rounded-xl backdrop-blur-md shadow-sm hover:shadow-md transition glow-cyan p-4 md:p-5">

            <h2 className="text-sm font-semibold text-foreground tracking-wide mb-3">
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
        {activeModule === "AI" && twinStatus && (

          <div className="bg-card border border-border rounded-xl backdrop-blur-md shadow-sm hover:shadow-md transition glow-cyan p-4 md:p-5">

            <h2 className="text-sm font-semibold text-foreground tracking-wide mb-3">
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

        {/* Road Profile */}
        {activeModule === "Road" && profile.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-3 md:p-4">
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground mb-2">Road Profile</h2>
            <RoadProfileChart profile={profile} />
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-background border-t border-border p-2 z-50">
          <Input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runCommand()}
            placeholder="Command (add, save, export...)"
            className="font-mono text-xs"
          />
        </div>


      </div>
    </div >
  );
}
