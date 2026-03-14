export function generateCorridor(points:any[], width:number){

 const corridor:any[] = []

 for(let i=0;i<points.length;i++){

  const p = points[i]

  const x = parseFloat(p.easting)
  const y = parseFloat(p.northing)
  const z = parseFloat(p.elevation)

  let dx = 0
  let dy = 0

  if(i < points.length-1){

   const next = points[i+1]

   dx = parseFloat(next.easting) - x
   dy = parseFloat(next.northing) - y

  }

  const len = Math.sqrt(dx*dx + dy*dy)

  if(len === 0) continue

  dx /= len
  dy /= len

  const nx = -dy
  const ny = dx

  const left = {
   x: x + nx * width/2,
   y: y + ny * width/2,
   z
  }

  const right = {
   x: x - nx * width/2,
   y: y - ny * width/2,
   z
  }

  corridor.push({
   center:{x,y,z},
   left,
   right
  })

 }

 return corridor
}