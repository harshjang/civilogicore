import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FileText, Upload, Search, FolderOpen, Eye, Download, File, Trash2, ArrowLeft, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocRecord {
  id: string;
  name: string;
  type: string; // 'file' or 'folder'
  file_type: string | null;
  file_size: number;
  storage_path: string | null;
  parent_folder_id: string | null;
  status: string;
  created_at: string;
}

const typeIcons: Record<string, string> = {
  DWG: "text-primary",
  PDF: "text-destructive",
  XLSX: "text-survey-green",
  CSV: "text-survey-orange",
};

function formatSize(bytes: number) {
  if (bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string | null; name: string }[]>([{ id: null, name: "Root" }]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    if (!user) return;
    let query = supabase.from("documents").select("*").order("type", { ascending: false }).order("created_at", { ascending: false });

    if (currentFolder) {
      query = query.eq("parent_folder_id", currentFolder);
    } else {
      query = query.is("parent_folder_id", null);
    }

    const { data, error } = await query;
    if (error) { toast.error("Failed to load documents"); console.error(error); }
    else setDocuments((data as DocRecord[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadDocuments(); }, [user, currentFolder]);

  const handleUpload = () => fileInputRef.current?.click();

  const processUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toUpperCase() || "";
      const storagePath = `${user.id}/${crypto.randomUUID()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("user-documents")
        .upload(storagePath, file);

      if (uploadError) { toast.error(`Failed to upload ${file.name}`); console.error(uploadError); continue; }

      const { error: dbError } = await supabase.from("documents").insert({
        user_id: user.id,
        name: file.name,
        type: "file",
        file_type: ext,
        file_size: file.size,
        storage_path: storagePath,
        parent_folder_id: currentFolder,
        status: "Draft",
      });

      if (dbError) { toast.error(`Failed to save ${file.name}`); console.error(dbError); continue; }
    }

    toast.success(`Uploaded ${files.length} file(s)`);
    e.target.value = "";
    loadDocuments();
  };

  const createFolder = async () => {
    if (!user) return;
    const name = prompt("Folder name:");
    if (!name?.trim()) return;

    const { error } = await supabase.from("documents").insert({
      user_id: user.id,
      name: name.trim(),
      type: "folder",
      parent_folder_id: currentFolder,
    });

    if (error) { toast.error("Failed to create folder"); console.error(error); }
    else { toast.success("Folder created"); loadDocuments(); }
  };

  const deleteDoc = async (doc: DocRecord) => {
    if (doc.type === "file" && doc.storage_path) {
      await supabase.storage.from("user-documents").remove([doc.storage_path]);
    }
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); loadDocuments(); }
  };

  const downloadDoc = async (doc: DocRecord) => {
    if (!doc.storage_path) return;
    const { data, error } = await supabase.storage.from("user-documents").download(doc.storage_path);
    if (error || !data) { toast.error("Download failed"); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openFolder = (folder: DocRecord) => {
    setCurrentFolder(folder.id);
    setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
  };

  const goToFolder = (idx: number) => {
    const target = folderPath[idx];
    setCurrentFolder(target.id);
    setFolderPath(folderPath.slice(0, idx + 1));
  };

  const filtered = documents.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6 pt-14 md:pt-8">
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={processUpload} />

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl md:text-2xl font-mono font-bold text-foreground">Documents</h1>
        <p className="text-xs md:text-sm text-muted-foreground font-mono mt-1">PLANS · REPORTS · DRAWINGS · DATA FILES</p>
      </motion.div>

      {/* Breadcrumb */}
      {folderPath.length > 1 && (
        <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
          {folderPath.map((f, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              <button onClick={() => goToFolder(i)} className="hover:text-primary transition-colors">
                {f.name}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search & Upload */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-10 font-mono text-sm bg-card border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button className="font-mono text-xs gap-2 flex-1 sm:flex-initial" onClick={handleUpload}>
            <Upload className="w-3.5 h-3.5" />
            Upload
          </Button>
          <Button variant="outline" className="font-mono text-xs gap-2 flex-1 sm:flex-initial" onClick={createFolder}>
            <FolderPlus className="w-3.5 h-3.5" />
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
        {loading ? (
          <div className="p-8 text-center">
            <p className="font-mono text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center">
            <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="font-mono text-sm text-muted-foreground">
              {searchQuery ? "No matching documents" : "No documents uploaded yet"}
            </p>
            <p className="font-mono text-xs text-muted-foreground/60 mt-1">Upload files to see them here</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((doc) => (
              <div key={doc.id} className="p-4 flex items-center gap-3 hover:bg-secondary/20 transition-colors">
                {doc.type === "folder" ? (
                  <FolderOpen className="w-5 h-5 text-primary shrink-0" />
                ) : (
                  <File className={`w-5 h-5 shrink-0 ${typeIcons[doc.file_type || ""] || "text-muted-foreground"}`} />
                )}
                <div className="flex-1 min-w-0">
                  {doc.type === "folder" ? (
                    <button onClick={() => openFolder(doc)} className="font-mono text-sm text-foreground hover:text-primary transition-colors truncate block">
                      {doc.name}
                    </button>
                  ) : (
                    <p className="font-mono text-sm text-foreground truncate">{doc.name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    {doc.file_type && (
                      <span className="px-2 py-0.5 rounded bg-secondary text-[10px] font-mono text-secondary-foreground">{doc.file_type}</span>
                    )}
                    <span className="text-[10px] font-mono text-muted-foreground">{formatSize(doc.file_size)}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {doc.type === "file" && (
                    <button onClick={() => downloadDoc(doc)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => deleteDoc(doc)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
