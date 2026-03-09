import { motion } from "framer-motion";
import { FileText, Upload, Search, FolderOpen, Eye, Download, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const documents: { name: string; type: string; size: string; date: string; status: string }[] = [];

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
    <div className="p-4 md:p-8 space-y-6 pt-14 md:pt-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl md:text-2xl font-mono font-bold text-foreground">Documents</h1>
        <p className="text-xs md:text-sm text-muted-foreground font-mono mt-1">PLANS · REPORTS · DRAWINGS · DATA FILES</p>
      </motion.div>

      {/* Search & Upload */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-10 font-mono text-sm bg-card border-border" />
        </div>
        <div className="flex gap-2">
          <Button className="font-mono text-xs gap-2 flex-1 sm:flex-initial">
            <Upload className="w-3.5 h-3.5" />
            Upload
          </Button>
          <Button variant="outline" className="font-mono text-xs gap-2 flex-1 sm:flex-initial">
            <FolderOpen className="w-3.5 h-3.5" />
            New Folder
          </Button>
        </div>
      </motion.div>

      {/* Document List */}
      <motion.div
        className="bg-card rounded-lg border border-border"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {documents.length === 0 ? (
          <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center">
            <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="font-mono text-sm text-muted-foreground">No documents uploaded yet</p>
            <p className="font-mono text-xs text-muted-foreground/60 mt-1">Upload files to see them here</p>
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-border/50">
              {documents.map((doc) => (
                <div key={doc.name} className="p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <File className={`w-4 h-4 mt-0.5 shrink-0 ${typeIcons[doc.type] || "text-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-mono truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded bg-secondary text-[10px] font-mono text-secondary-foreground">{doc.type}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{doc.size}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{doc.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pl-7">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold ${statusColors[doc.status]}`}>
                      {doc.status}
                    </span>
                    <div className="flex gap-2">
                      <button className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
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
          </>
        )}
      </motion.div>
    </div>
  );
}
