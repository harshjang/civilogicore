import { createContext, useContext, useState } from "react";

const WorkspaceContext = createContext<any>(null);
const context = useContext(WorkspaceContext);

if (!context) {
  throw new Error("useWorkspace must be used within WorkspaceProvider");
}

export function WorkspaceProvider({ children }: any) {
  const [activeModule, setActiveModule] = useState("survey");
  const [activeTool, setActiveTool] = useState("");
  const [drawMode, setDrawMode] = useState(false);

  return (
    <WorkspaceContext.Provider
      value={{
        activeModule,
        setActiveModule,
        activeTool,
        setActiveTool,
        drawMode,
        setDrawMode,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider");
  }
  return context;
};

const workspace = useWorkspace();
console.log(workspace);