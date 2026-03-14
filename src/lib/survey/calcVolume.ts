export function calcCutFill(existing:any[], proposed:any[]) {

 let cut = 0
 let fill = 0

 for(let i=0;i<existing.length;i++){

  const dz = proposed[i].z - existing[i].z

  if(dz > 0) fill += dz
  else cut += Math.abs(dz)

 }

 return {
  cut,
  fill
 }

}