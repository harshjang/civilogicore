export function computeSuperelevation(segments:any[]){

  const results=[]

  for(let i=0;i<segments.length;i++){

    const seg=segments[i]

    const curvature=Math.abs(seg.bearing-(segments[i-1]?.bearing||seg.bearing))

    const e=Math.min(0.08,curvature*0.5)

    results.push({
      segment:i,
      superelevation:e
    })

  }

  return results
}