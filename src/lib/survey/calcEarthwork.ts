export function calculateEarthwork(points:any[], triangles:number[], proposedElevation:number){

 let cut = 0
 let fill = 0

 for(let i=0;i<triangles.length;i+=3){

   const p1 = points[triangles[i]]
   const p2 = points[triangles[i+1]]
   const p3 = points[triangles[i+2]]

   const x1 = parseFloat(p1.easting)
   const y1 = parseFloat(p1.northing)
   const z1 = parseFloat(p1.elevation)

   const x2 = parseFloat(p2.easting)
   const y2 = parseFloat(p2.northing)
   const z2 = parseFloat(p2.elevation)

   const x3 = parseFloat(p3.easting)
   const y3 = parseFloat(p3.northing)
   const z3 = parseFloat(p3.elevation)

   const area = Math.abs(
     (x1*(y2-y3) + x2*(y3-y1) + x3*(y1-y2)) / 2
   )

   const dz1 = proposedElevation - z1
   const dz2 = proposedElevation - z2
   const dz3 = proposedElevation - z3

   const avg = (dz1 + dz2 + dz3) / 3

   const volume = area * avg

   if(volume > 0) fill += volume
   else cut += Math.abs(volume)

 }

 return {
   cut,
   fill,
   net: fill - cut
 }

}