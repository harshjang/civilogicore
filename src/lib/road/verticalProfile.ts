export interface ProfilePoint{
  station:number
  elevation:number
}

export function generateVerticalProfile(points:any[]):ProfilePoint[]{

  const profile:ProfilePoint[]=[]
  let station=0

  for(let i=0;i<points.length;i++){

    if(i>0){

      const dx=parseFloat(points[i].easting)-parseFloat(points[i-1].easting)
      const dy=parseFloat(points[i].northing)-parseFloat(points[i-1].northing)

      station+=Math.sqrt(dx*dx+dy*dy)

    }

    profile.push({
      station,
      elevation:parseFloat(points[i].elevation)||0
    })

  }

  return profile
}