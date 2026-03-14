export function calculateSectionVolume(section:any, designElevation:number){

  const dz = designElevation - section.center.z

  const width = 10

  const area = width * dz

  if(dz > 0){

    return {
      fill: area,
      cut:0
    }

  }else{

    return {
      cut:Math.abs(area),
      fill:0
    }

  }

}