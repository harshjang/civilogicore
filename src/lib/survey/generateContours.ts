export function generateContours(points:any[], interval:number){

  if(points.length < 3) return []

  const elevations = points.map(p => parseFloat(p.elevation))

  const minZ = Math.min(...elevations)
  const maxZ = Math.max(...elevations)

  const contours:any[] = []

  for(let z = Math.ceil(minZ/interval)*interval; z<=maxZ; z+=interval){

    const contourPoints = []

    for(let i=0;i<points.length-1;i++){

      const p1 = points[i]
      const p2 = points[i+1]

      const z1 = parseFloat(p1.elevation)
      const z2 = parseFloat(p2.elevation)

      if((z1<=z && z2>=z) || (z2<=z && z1>=z)){

        const x1 = parseFloat(p1.easting)
        const y1 = parseFloat(p1.northing)

        const x2 = parseFloat(p2.easting)
        const y2 = parseFloat(p2.northing)

        const t = (z - z1)/(z2-z1)

        const x = x1 + t*(x2-x1)
        const y = y1 + t*(y2-y1)

        contourPoints.push({x,y,z})

      }

    }

    if(contourPoints.length>1){

      contours.push({
        elevation:z,
        points:contourPoints
      })

    }

  }

  return contours

}