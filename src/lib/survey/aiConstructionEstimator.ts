export function aiConstructionEstimator(layout:any){

 const result={
  roads:0,
  buildings:0,
  water:0,
  sewer:0,
  totalCost:0
 }

 const roadCostPerMeter=200
 const buildingCostPerSqm=500
 const utilityCostPerMeter=50

 // ROAD LENGTH
 layout.roads.forEach((r:any)=>{
  const length=Math.abs(r.maxX-r.minX)
  result.roads+=length
 })

 // BUILDING AREA
 layout.buildings.forEach((b:any)=>{

  const width=Math.abs(b.corners[1].x-b.corners[0].x)
  const depth=Math.abs(b.corners[2].y-b.corners[1].y)

  const area=width*depth

  result.buildings+=area

 })

 // UTILITIES
 layout.roads.forEach((r:any)=>{
  const length=Math.abs(r.maxX-r.minX)
  result.water+=length
  result.sewer+=length
 })

 const roadCost=result.roads*roadCostPerMeter
 const buildingCost=result.buildings*buildingCostPerSqm
 const utilityCost=(result.water+result.sewer)*utilityCostPerMeter

 result.totalCost=roadCost+buildingCost+utilityCost

 return{
  roadLength:result.roads,
  buildingArea:result.buildings,
  waterLength:result.water,
  sewerLength:result.sewer,
  roadCost,
  buildingCost,
  utilityCost,
  totalCost:result.totalCost
 }

}