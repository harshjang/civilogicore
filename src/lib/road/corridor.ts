export function generateCorridor(sections:any[]){

  const corridor=[]

  for(let i=0;i<sections.length-1;i++){

    const s1=sections[i]
    const s2=sections[i+1]

    corridor.push({

      left1:s1.left,
      right1:s1.right,

      left2:s2.left,
      right2:s2.right

    })

  }

  return corridor
}