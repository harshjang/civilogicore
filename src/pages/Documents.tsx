import { motion } from "framer-motion";
import { FileText, Upload, Search, FolderOpen, Eye, Download, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const documents = [
  { name: "Highway_Bridge_Plan.dwg", type: "DWG", size: "4.2 MB", date: "2026-03-07", status: "Approved" },
  { name: "Soil_Investigation_Report.pdf", type: "PDF", size: "12.8 MB", date: "2026-03-05", status: "In Review" },
  { name: "Structural_Analysis_v3.xlsx", type: "XLSX", size: "1.1 MB", date: "2026-03-04", status: "Draft" },
  { name: "Site_Survey_Points.csv", type: "CSV", size: "256 KB", date: "2026-03-03", status: "Approved" },
  { name: "Concrete_Mix_Design.pdf", type: "PDF", size: "3.4 MB", date: "2026-03-01", status: "Approved" },
  { name: "Drainage_Layout.dwg", type: "DWG", size: "8.7 MB", date: "2026-02-28", status: "In Review" },
];

const statusColors: Record<string, string> = {
  Approved: "text-survey-green bg-survey-green/10",
  "In Review": "text-primary bg-primary/10",
  Draft: "text-survey-orange bg-survey-orange/10",
};

const typeIcons: Record<string, string> = {
  DWG: "text-primary",
  PDF: "text-survey-red",
  XLSX: "text-survey-green",
  CSV: "text-survey-orange",
};

export default function Documents() {
  return (
    <div className="p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-mono font-bold text-foreground">Documents</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">PLANS · REPORTS · DRAWINGS · DATA FILES</p>
      </motion.div>

      {/* Search & Upload */}
      <motion.div
        className="flex flex-wrap gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-10 font-mono text-sm bg-card border-border" />
        </div>
        <Button className="font-mono text-xs gap-2">
          <Upload className="w-3.5 h-3.5" />
          Upload
        </Button>
        <Button variant="outline" className="font-mono text-xs gap-2">
          <FolderOpen className="w-3.5 h-3.5" />
          New Folder
        </Button>
      </motion.div>

      {/* Document List */}
      <motion.div
        className="bg-card rounded-lg border border-border"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["File Name", "Type", "Size", "Date", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.name} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="px-5 py-4 flex items-center gap-3">
                    <File className={`w-4 h-4 ${typeIcons[doc.type] || "text-muted-foreground"}`} />
                    <span className="text-sm text-foreground font-mono">{doc.name}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 rounded bg-secondary text-xs font-mono text-secondary-foreground">{doc.type}</span>
                  </td>
                  <td className="px-5 py-4 text-sm font-mono text-muted-foreground">{doc.size}</td>
                  <td className="px-5 py-4 text-sm font-mono text-muted-foreground">{doc.date}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold ${statusColors[doc.status]}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 flex gap-2">
                    <button className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <Download className="w-3.5 h-3.5" />
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
