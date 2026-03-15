export default function WorkspaceSidebar({activeTool,setActiveTool}){

const tools=[
"survey",
"terrain",
"road",
"hydrology",
"utilities",
"ai"
]

return(

<div className="w-48 border-r border-border p-3 flex flex-col gap-2">

{tools.map(t=>(
<button
key={t}
className={`text-left px-3 py-2 rounded font-mono text-xs
${activeTool===t ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
onClick={()=>setActiveTool(t)}
>
{t.toUpperCase()}
</button>
))}

</div>

)

}