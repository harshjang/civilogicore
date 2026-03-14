export function digitalTwinMonitor(plan:any, actual:any){

 const result={
  plannedProgress:0,
  actualProgress:0,
  delay:0,
  status:"On Schedule"
 }

 const plannedElements=
  (plan.roads?.length || 0) +
  (plan.buildings?.length || 0)

 const actualElements=
  (actual.roads?.length || 0) +
  (actual.buildings?.length || 0)

 result.plannedProgress = plannedElements
 result.actualProgress = actualElements

 result.delay = plannedElements - actualElements

 if(result.delay > 0){
  result.status="Delayed"
 }

 if(result.delay < 0){
  result.status="Ahead of Schedule"
 }

 return result

}