import { useState, useEffect } from "react";
import { FileText, Save, RefreshCw, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SurveyPoint {
  id: string;
  pointNo: string;
  easting: string;
  northing: string;
  elevation: string;
  code: string;
  layer: string;
}

interface ExistingDoc {
  id: string;
  name: string;
  storage_path: string | null;
  created_at: string;
}

interface SaveToDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  points: SurveyPoint[];
  userId: string;
  source: string;
}

function pointsToCSV(points: SurveyPoint[]): string {
  const header = "PointNo,Easting,Northing,Elevation,Code,Layer";
  const rows = points.map(
    (p) => `${p.pointNo},${p.easting},${p.northing},${p.elevation},${p.code},${p.layer}`
  );
  return [header, ...rows].join("\n");
}

export default function SaveToDocumentsDialog({
  open,
  onOpenChange,
  points,
  userId,
  source,
}: SaveToDocumentsDialogProps) {
  const [mode, setMode] = useState<"new" | "update">("new");
  const [fileName, setFileName] = useState("survey_data.csv");
  const [existingDocs, setExistingDocs] = useState<ExistingDoc[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Load existing survey CSV documents
    const load = async () => {
      const { data } = await supabase
        .from("documents")
        .select("id, name, storage_path, created_at")
        .eq("file_type", "CSV")
        .order("created_at", { ascending: false });
      setExistingDocs((data as ExistingDoc[]) || []);
    };
    load();
  }, [open]);

  const handleSave = async () => {
    if (points.length === 0) {
      toast.error("No points to save");
      return;
    }
    setSaving(true);

    const csvContent = pointsToCSV(points);
    const blob = new Blob([csvContent], { type: "text/csv" });

    try {
      if (mode === "update" && selectedDocId) {
        // Update existing document
        const doc = existingDocs.find((d) => d.id === selectedDocId);
        if (!doc) { toast.error("Document not found"); setSaving(false); return; }

        // Remove old file from storage
        if (doc.storage_path) {
          await supabase.storage.from("user-documents").remove([doc.storage_path]);
        }

        // Upload new version
        const storagePath = `${userId}/${crypto.randomUUID()}_${doc.name}`;
        const { error: uploadError } = await supabase.storage
          .from("user-documents")
          .upload(storagePath, blob);

        if (uploadError) { toast.error("Upload failed"); console.error(uploadError); setSaving(false); return; }

        const { error: dbError } = await supabase
          .from("documents")
          .update({
            storage_path: storagePath,
            file_size: blob.size,
          })
          .eq("id", selectedDocId);

        if (dbError) { toast.error("Failed to update document record"); console.error(dbError); setSaving(false); return; }

        toast.success(`Updated "${doc.name}" in Documents`);
      } else {
        // Create new document
        const name = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
        const storagePath = `${userId}/${crypto.randomUUID()}_${name}`;

        const { error: uploadError } = await supabase.storage
          .from("user-documents")
          .upload(storagePath, blob);

        if (uploadError) { toast.error("Upload failed"); console.error(uploadError); setSaving(false); return; }

        const handleSave = async () => {
          const { error } = await supabase.from("documents").insert({
            name,
            user_id: userId,
            data: points,
            source: source
          });

          if (error) {
            toast.error("Save failed");
          } else {
            toast.success("Saved successfully");
            onOpenChange(false);
          }
        };

        const { error: dbError } = await supabase.from("documents").insert({
          user_id: userId,
          name,
          type: "file",
          file_type: "CSV",
          file_size: blob.size,
          storage_path: storagePath,
          status: "Active",
          source: source
        });

        if (dbError) { toast.error("Failed to save document record"); console.error(dbError); setSaving(false); return; }

        toast.success(`Saved "${name}" to Documents`);
      }

      onOpenChange(false);
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Save Survey Points to Documents
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={mode === "new" ? "default" : "outline"}
              size="sm"
              className="font-mono text-xs gap-2 flex-1"
              onClick={() => setMode("new")}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New File
            </Button>
            <Button
              variant={mode === "update" ? "default" : "outline"}
              size="sm"
              className="font-mono text-xs gap-2 flex-1"
              onClick={() => setMode("update")}
              disabled={existingDocs.length === 0}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Update Existing
            </Button>
          </div>

          {mode === "new" ? (
            <div className="space-y-2">
              <label className="font-mono text-xs text-muted-foreground">File Name</label>
              <Input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="font-mono text-sm bg-secondary border-border"
                placeholder="survey_plot_01.csv"
              />
              <p className="font-mono text-[10px] text-muted-foreground">
                {points.length} points will be saved as a new CSV document.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="font-mono text-xs text-muted-foreground">Select Document to Update</label>
              <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-md p-2 bg-secondary/30">
                {existingDocs.length === 0 ? (
                  <p className="font-mono text-xs text-muted-foreground text-center py-4">No existing CSV documents found</p>
                ) : (
                  existingDocs.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`w-full text-left px-3 py-2 rounded-md font-mono text-xs transition-colors flex items-center justify-between ${selectedDocId === doc.id
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "hover:bg-secondary text-foreground"
                        }`}
                    >
                      <span className="truncate">{doc.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </button>
                  ))
                )}
              </div>
              <p className="font-mono text-[10px] text-muted-foreground">
                {points.length} points will replace the selected document's content.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="font-mono text-xs" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="font-mono text-xs gap-2"
            onClick={handleSave}
            disabled={saving || (mode === "update" && !selectedDocId)}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : mode === "update" ? "Update Document" : "Save to Documents"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
