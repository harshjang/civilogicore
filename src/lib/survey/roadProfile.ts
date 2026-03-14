export function generateProfile(points:any[]) {

 let dist = 0

 const profile = []

 for(let i=0;i<points.length;i++){

  if(i>0){

   const dx = points[i].easting - points[i-1].easting
   const dy = points[i].northing - points[i-1].northing

   dist += Math.sqrt(dx*dx + dy*dy)

  }

  profile.push({
   chainage: dist,
   elevation: points[i].elevation
  })

 }

 return profile
}