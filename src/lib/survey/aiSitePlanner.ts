export function aiSitePlanner(boundary:any[], rules:any){

 const plots:any[]=[]
 const roads:any[]=[]
 const buildings:any[]=[]

 const minX=Math.min(...boundary.map(p=>parseFloat(p.easting)))
 const maxX=Math.max(...boundary.map(p=>parseFloat(p.easting)))

 const minY=Math.min(...boundary.map(p=>parseFloat(p.northing)))
 const maxY=Math.max(...boundary.map(p=>parseFloat(p.northing)))

 const plotWidth=rules.plotWidth || 20
 const plotDepth=rules.plotDepth || 30
 const roadWidth=rules.roadWidth || 8
 const setback=rules.setback || 3

 const cols=Math.floor((maxX-minX)/(plotWidth))
 const rows=Math.floor((maxY-minY)/(plotDepth+roadWidth))

 let id=1

 for(let r=0;r<rows;r++){

  const y=minY+r*(plotDepth+roadWidth)

  roads.push({
   y:y+plotDepth,
   minX,
   maxX
  })

  for(let c=0;c<cols;c++){

   const x=minX+c*plotWidth

   const plot={
    id:id++,
    corners:[
     {x,y},
     {x:x+plotWidth,y},
     {x:x+plotWidth,y:y+plotDepth},
     {x,y:y+plotDepth}
    ]
   }

   plots.push(plot)

   buildings.push({
    corners:[
     {x:x+setback,y:y+setback},
     {x:x+plotWidth-setback,y:y+setback},
     {x:x+plotWidth-setback,y:y+plotDepth-setback},
     {x:x+setback,y:y+plotDepth-setback}
    ]
   })

  }

 }

 return {plots,roads,buildings}

}