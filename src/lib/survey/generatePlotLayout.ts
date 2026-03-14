export function generatePlotLayout(boundary:any[], plotWidth:number, plotDepth:number){

 const plots:any[] = []

 if(boundary.length < 4) return plots

 const minX = Math.min(...boundary.map(p=>parseFloat(p.easting)))
 const maxX = Math.max(...boundary.map(p=>parseFloat(p.easting)))

 const minY = Math.min(...boundary.map(p=>parseFloat(p.northing)))
 const maxY = Math.max(...boundary.map(p=>parseFloat(p.northing)))

 const cols = Math.floor((maxX - minX) / plotWidth)
 const rows = Math.floor((maxY - minY) / plotDepth)

 let id = 1

 for(let r=0;r<rows;r++){

  for(let c=0;c<cols;c++){

   const x = minX + c*plotWidth
   const y = minY + r*plotDepth

   plots.push({
    id:id++,
    corners:[
     {x,y},
     {x:x+plotWidth,y},
     {x:x+plotWidth,y:y+plotDepth},
     {x,y:y+plotDepth}
    ]
   })

  }

 }

 return plots
}