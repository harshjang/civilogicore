export function polygonArea(points:any[]) {

 let area = 0

 for(let i=0;i<points.length;i++){

  const j=(i+1)%points.length

  const xi=parseFloat(points[i].easting)
  const yi=parseFloat(points[i].northing)

  const xj=parseFloat(points[j].easting)
  const yj=parseFloat(points[j].northing)

  area += (xi*yj - xj*yi)
 }

 return Math.abs(area/2)

}