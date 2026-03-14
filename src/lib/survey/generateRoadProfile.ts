export function generateRoadProfile(points:any[]) {

  let distance = 0

  const profile:any[] = []

  for(let i=0;i<points.length;i++){

    const p = points[i]

    const x = parseFloat(p.easting)
    const y = parseFloat(p.northing)
    const z = parseFloat(p.elevation)

    if(i>0){

      const prev = points[i-1]

      const dx = x - parseFloat(prev.easting)
      const dy = y - parseFloat(prev.northing)

      distance += Math.sqrt(dx*dx + dy*dy)

    }

    profile.push({
      chainage: distance,
      elevation: z
    })

  }

  return profile
}