export function generateCrossSections(points:any[], spacing:number){

  const sections:any[] = []

  for(let i=0;i<points.length;i+=spacing){

    const center = points[i]

    const cx = parseFloat(center.easting)
    const cy = parseFloat(center.northing)
    const cz = parseFloat(center.elevation)

    const left = {
      x: cx - 5,
      y: cy,
      z: cz
    }

    const right = {
      x: cx + 5,
      y: cy,
      z: cz
    }

    sections.push({
      chainage:i,
      center:{x:cx,y:cy,z:cz},
      left,
      right
    })

  }

  return sections
}