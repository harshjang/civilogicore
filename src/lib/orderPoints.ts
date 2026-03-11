export function orderPoints(points:any[]) {

  const cx = points.reduce((s,p)=>s+parseFloat(p.easting),0)/points.length
  const cy = points.reduce((s,p)=>s+parseFloat(p.northing),0)/points.length

  return [...points].sort((a,b)=>{

    const angA = Math.atan2(a.northing-cy,a.easting-cx)
    const angB = Math.atan2(b.northing-cy,b.easting-cx)

    return angA-angB
  })

}
