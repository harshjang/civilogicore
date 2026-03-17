import { createContext, useContext, useState } from "react"

type Module =
  | "survey"
  | "terrain"
  | "road"
  | "hydrology"
  | "utilities"
  | "ai"

const WorkspaceContext = createContext<any>(null)

export function WorkspaceProvider({ children }: any) {
  const [activeModule, setActiveModule] = useState<Module>("survey")

  return (
    <WorkspaceContext.Provider value={{ activeModule, setActiveModule }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspace = () => useContext(WorkspaceContext)