export function generateConstructionPhases(layout:any){

 const phases:any[]=[]

 phases.push({
  name:"Site Preparation",
  duration:5
 })

 phases.push({
  name:"Road Construction",
  duration:10,
  elements:layout.roads
 })

 phases.push({
  name:"Utility Installation",
  duration:8,
  elements:layout.utilities
 })

 phases.push({
  name:"Building Foundations",
  duration:12,
  elements:layout.buildings
 })

 phases.push({
  name:"Building Structures",
  duration:20,
  elements:layout.buildings
 })

 phases.push({
  name:"Final Infrastructure",
  duration:6
 })

 return phases

}