export interface CrossSection{
  left:{x:number,y:number}
  right:{x:number,y:number}
  center:{x:number,y:number}
}

export function generateCrossSections(points:any[],width=10){

  const sections:CrossSection[]=[]

  for(let i=0;i<points.length-1;i++){

    const x=parseFloat(points[i].easting)
    const y=parseFloat(points[i].northing)

    const x2=parseFloat(points[i+1].easting)
    const y2=parseFloat(points[i+1].northing)

    const dx=x2-x
    const dy=y2-y

    const len=Math.sqrt(dx*dx+dy*dy)

    const nx=-dy/len
    const ny=dx/len

    sections.push({
      center:{x,y},
      left:{
        x:x+nx*width/2,
        y:y+ny*width/2
      },
      right:{
        x:x-nx*width/2,
        y:y-ny*width/2
      }
    })

  }

  return sections
}