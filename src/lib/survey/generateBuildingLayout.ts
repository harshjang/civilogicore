export function generateBuildingLayout(plot:any, setback:number){

 const corners = plot.corners

 const building = []

 for(let i=0;i<corners.length;i++){

  const p = corners[i]

  const next = corners[(i+1)%corners.length]

  const dx = next.x - p.x
  const dy = next.y - p.y

  const len = Math.sqrt(dx*dx + dy*dy)

  if(len===0) continue

  const nx = -dy/len
  const ny = dx/len

  building.push({
   x: p.x + nx*setback,
   y: p.y + ny*setback
  })

 }

 return building
}