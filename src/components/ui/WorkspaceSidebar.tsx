import { useWorkspace } from "@/contexts/WorkspaceContext";

const modules = ["survey", "terrain", "road", "hydrology", "utilities", "ai"];

export default function WorkspaceSidebar() {
  const { activeModule, setActiveModule, setActiveTool } = useWorkspace();

  return (
    <div className="w-48 bg-sidebar p-3 space-y-2">
      {modules.map((m) => (
        <button
          key={m}
          onClick={() => {
            setActiveModule(m);
            setActiveTool(""); // reset tool
          }}
          className={`w-full text-left p-2 rounded ${
            activeModule === m ? "bg-primary text-white" : "bg-muted"
          }`}
        >
          {m.toUpperCase()}
        </button>
      ))}
    </div>
  );
}