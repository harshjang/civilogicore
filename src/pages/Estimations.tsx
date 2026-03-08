import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Ruler, Box, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Estimations() {
  const [calcType, setCalcType] = useState("earthwork");
  const [length, setLength] = useState("100");
  const [width, setWidth] = useState("10");
  const [depth, setDepth] = useState("2");

  const volume = (parseFloat(length) || 0) * (parseFloat(width) || 0) * (parseFloat(depth) || 0);

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
                <Input value={length} onChange={(e) => setLength(e.target.value)} className="font-mono text-sm bg-secondary border-border" />
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted-foreground uppercase mb-1.5 block">Width (m)</label>
                <Input value={width} onChange={(e) => setWidth(e.target.value)} className="font-mono text-sm bg-secondary border-border" />
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted-foreground uppercase mb-1.5 block">Depth (m)</label>
                <Input value={depth} onChange={(e) => setDepth(e.target.value)} className="font-mono text-sm bg-secondary border-border" />
              </div>
            </div>

            <Button className="w-full font-mono text-sm gap-2">
              <Calculator className="w-4 h-4" />
              Calculate
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
                V = L × W × D = {length} × {width} × {depth} = {volume.toLocaleString(undefined, { maximumFractionDigits: 2 })} m³
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
          <h2 className="font-mono text-xs md:text-sm font-semibold text-foreground">RECENT ESTIMATES</h2>
        </div>
        <div className="divide-y divide-border/50">
          {[
            { name: "Road Embankment - NH44", type: "Earthwork", vol: "12,500 m³", date: "Mar 7" },
            { name: "Foundation Pad - Block A", type: "Concrete", vol: "86 m³", date: "Mar 5" },
            { name: "Retaining Wall", type: "Brickwork", vol: "240 m²", date: "Mar 3" },
          ].map((est) => (
            <div key={est.name} className="px-4 md:px-5 py-3 md:py-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
              <div>
                <p className="text-xs md:text-sm text-foreground font-mono">{est.name}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground font-mono mt-0.5">{est.type} · {est.date}</p>
              </div>
              <span className="font-mono text-xs md:text-sm font-semibold text-primary">{est.vol}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
