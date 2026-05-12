import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calculator, Ruler, Box, Layers, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SavedEstimation {
  id: string;
  calc_type: string;
  length: number;
  width: number;
  depth: number;
  volume: number;
  label: string | null;
  created_at: string;
}

const calcTypeLabels: Record<string, string> = {
  earthwork: "Earthwork Volume",
  concrete: "Concrete Volume",
  brick: "Brickwork",
  steel: "Steel Weight",
};

export default function Estimations() {
  const { user } = useAuth();
  const [calcType, setCalcType] = useState("earthwork");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [depth, setDepth] = useState("");
  const [saved, setSaved] = useState<SavedEstimation[]>([]);
  const [loading, setLoading] = useState(true);

  const volume = (parseFloat(length) || 0) * (parseFloat(width) || 0) * (parseFloat(depth) || 0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("estimations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else setSaved((data as SavedEstimation[]) || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const saveEstimation = async () => {
    if (!user) return;
    if (volume === 0) { toast.error("Enter dimensions first"); return; }

    const label = `${calcTypeLabels[calcType]} — ${length}×${width}×${depth}m`;
    const { error } = await supabase.from("estimations").insert({
      user_id: user.id,
      calc_type: calcType,
      length: parseFloat(length) || 0,
      width: parseFloat(width) || 0,
      depth: parseFloat(depth) || 0,
      volume,
      label,
    });

    if (error) { toast.error("Failed to save"); console.error(error); return; }
    toast.success("Estimation saved!");
    // Reload
    const { data } = await supabase.from("estimations").select("*").order("created_at", { ascending: false });
    setSaved((data as SavedEstimation[]) || []);
  };

  const deleteEstimation = async (id: string) => {
    const { error } = await supabase.from("estimations").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { setSaved(saved.filter((s) => s.id !== id)); toast.success("Deleted"); }
  };

  const loadEstimation = (est: SavedEstimation) => {
    setCalcType(est.calc_type);
    setLength(String(est.length));
    setWidth(String(est.width));
    setDepth(String(est.depth));
  };

  return (
    <div className="p-4 md:p-8 space-y-6 pt-14 md:pt-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl md:text-2xl font-mono font-bold text-foreground">Estimations</h1>
        <p className="text-xs md:text-sm text-muted-foreground font-mono mt-1">EARTHWORK · MATERIAL · STRUCTURAL CALCULATIONS</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Calculator */}
        <motion.div
          className="bg-card rounded-lg border border-border p-4 md:p-6 space-y-4 md:space-y-5"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <Calculator className="w-5 h-5 text-primary" />
            <h2 className="font-mono text-xs md:text-sm font-semibold text-foreground">QUICK CALCULATOR</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="font-mono text-[10px] md:text-xs text-muted-foreground uppercase mb-2 block">Calculation Type</label>
              <Select value={calcType} onValueChange={setCalcType}>
                <SelectTrigger className="font-mono text-sm bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="earthwork">Earthwork Volume</SelectItem>
                  <SelectItem value="concrete">Concrete Volume</SelectItem>
                  <SelectItem value="brick">Brickwork</SelectItem>
                  <SelectItem value="steel">Steel Weight</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <div>
                <label className="font-mono text-[10px] text-muted-foreground uppercase mb-1.5 block">Length (m)</label>
                <Input value={length} onChange={(e) => setLength(e.target.value)} className="font-mono text-sm bg-secondary border-border" placeholder="0" />
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted-foreground uppercase mb-1.5 block">Width (m)</label>
                <Input value={width} onChange={(e) => setWidth(e.target.value)} className="font-mono text-sm bg-secondary border-border" placeholder="0" />
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted-foreground uppercase mb-1.5 block">Depth (m)</label>
                <Input value={depth} onChange={(e) => setDepth(e.target.value)} className="font-mono text-sm bg-secondary border-border" placeholder="0" />
              </div>
            </div>

            <Button className="w-full font-mono text-sm gap-2" onClick={saveEstimation}>
              <Save className="w-4 h-4" />
              Calculate & Save
            </Button>
          </div>
        </motion.div>

        {/* Result */}
        <motion.div
          className="bg-card rounded-lg border border-glow p-4 md:p-6 space-y-4 md:space-y-5"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3">
            <Box className="w-5 h-5 text-primary" />
            <h2 className="font-mono text-xs md:text-sm font-semibold text-foreground">RESULT</h2>
          </div>

          <div className="space-y-3 md:space-y-4">
            <div className="p-3 md:p-4 bg-secondary/50 rounded-lg border border-border">
              <p className="font-mono text-[10px] md:text-xs text-muted-foreground uppercase">Volume</p>
              <p className="font-mono text-2xl md:text-3xl font-bold text-primary mt-1">
                {volume.toLocaleString(undefined, { maximumFractionDigits: 2 })} m³
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="font-mono text-[10px] text-muted-foreground uppercase">Weight (approx)</p>
                <p className="font-mono text-base md:text-lg font-semibold text-foreground mt-0.5">
                  {(volume * 1.8).toLocaleString(undefined, { maximumFractionDigits: 0 })} tonnes
                </p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="font-mono text-[10px] text-muted-foreground uppercase">Truck Loads (10m³)</p>
                <p className="font-mono text-base md:text-lg font-semibold text-foreground mt-0.5">
                  {Math.ceil(volume / 10)} loads
                </p>
              </div>
            </div>

            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span className="font-mono text-[10px] md:text-xs text-primary font-semibold">FORMULA</span>
              </div>
              <p className="font-mono text-[10px] md:text-xs text-muted-foreground mt-2">
                V = L × W × D = {length || "0"} × {width || "0"} × {depth || "0"} = {volume.toLocaleString(undefined, { maximumFractionDigits: 2 })} m³
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Saved Estimates */}
      <motion.div
        className="bg-card rounded-lg border border-border"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="p-4 md:p-5 border-b border-border">
          <h2 className="font-mono text-xs md:text-sm font-semibold text-foreground">SAVED ESTIMATES</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className="font-mono text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : saved.length === 0 ? (
          <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center">
            <Calculator className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="font-mono text-sm text-muted-foreground">No estimates saved yet</p>
            <p className="font-mono text-xs text-muted-foreground/60 mt-1">Run a calculation to see it here</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {saved.map((est) => (
              <div key={est.id} className="p-4 flex items-center gap-3 hover:bg-secondary/20 transition-colors">
                <Ruler className="w-4 h-4 text-primary shrink-0" />
                <button onClick={() => loadEstimation(est)} className="flex-1 min-w-0 text-left">
                  <p className="font-mono text-sm text-foreground truncate">{est.label || calcTypeLabels[est.calc_type]}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-primary font-semibold">{est.volume.toFixed(2)} m³</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {new Date(est.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>
                <button onClick={() => deleteEstimation(est.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
