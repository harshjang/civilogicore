import InstallButton from "@/components/ui/InstallButton";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function WorkspaceToolbar() {
  const { activeModule, activeTool, setActiveTool } = useWorkspace();

  const toolMap: any = {
    survey: ["import", "export", "edit", "live"],
    terrain: ["contours", "tin", "earthwork"],
    road: ["alignment", "sections", "profile", "corridor"],
    hydrology: ["drainage", "catchment", "watershed"],
    utilities: ["water", "sewer", "storm"],
    ai: ["estimate", "simulation"],
  };

  const tools = toolMap[activeModule] || [];

  return (
    <div className="flex gap-2 p-3 border-b border-border">
      {tools.map((tool: string) => (
        <button
          key={tool}
          onClick={() => setActiveTool(tool)}
          className={`px-3 py-1 rounded text-sm ${
            activeTool === tool ? "bg-primary text-white" : "bg-muted"
          }`}
        >
          {tool}
        </button>
      ))}
      <div className="flex items-center gap-2 ml-auto">
  <InstallButton />
</div>
    </div>
  );
}