export function calcPlotArea(corners:any[]){

 let area = 0

 for(let i=0;i<corners.length;i++){

  const j=(i+1)%corners.length

  area += corners[i].x * corners[j].y
  area -= corners[j].x * corners[i].y

 }

 return Math.abs(area/2)

}