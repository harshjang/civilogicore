export interface AlignmentSegment {
  start: { x:number,y:number,z:number }
  end: { x:number,y:number,z:number }
  length:number
  bearing:number
}

export function generateAlignment(points:any[]):AlignmentSegment[]{

  const segments:AlignmentSegment[]=[]

  for(let i=0;i<points.length-1;i++){

    const x1=parseFloat(points[i].easting)
    const y1=parseFloat(points[i].northing)
    const z1=parseFloat(points[i].elevation)||0

    const x2=parseFloat(points[i+1].easting)
    const y2=parseFloat(points[i+1].northing)
    const z2=parseFloat(points[i+1].elevation)||0

    const dx=x2-x1
    const dy=y2-y1

    const length=Math.sqrt(dx*dx+dy*dy)

    const bearing=Math.atan2(dy,dx)

    segments.push({
      start:{x:x1,y:y1,z:z1},
      end:{x:x2,y:y2,z:z2},
      length,
      bearing
    })

  }

  return segments
}