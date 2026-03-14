interface Point {
  x:number
  y:number
  z:number
}

export function computeFlowDirection(points:Point[]){

 const flow:any[] = []

 for(let i=0;i<points.length;i++){

  let lowest = null
  let minZ = points[i].z

  for(let j=0;j<points.length;j++){

   if(i===j) continue

   const dz = points[j].z

   if(dz < minZ){

    minZ = dz
    lowest = j

   }

  }

  flow.push({
   from:i,
   to:lowest
  })

 }

 return flow

}

export function computeFlowAccumulation(flow:any[]){

 const acc:number[] = new Array(flow.length).fill(0)

 flow.forEach(f=>{

  if(f.to !== null){

   acc[f.to] += 1

  }

 })

 return acc

}

export function extractDrainage(points:Point[],flow:any[],acc:number[]){

 const streams:any[] = []

 for(let i=0;i<flow.length;i++){

  if(acc[i] > 3){

   const from = points[i]
   const to = points[flow[i].to]

   streams.push({
    start:from,
    end:to
   })

  }

 }

 return streams

}