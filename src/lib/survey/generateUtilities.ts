export function generateUtilities(roads: any[], plots: any[]) {

  const utilities = {
    water: [] as any[],
    sewer: [] as any[],
    storm: [] as any[],
    power: [] as any[]
  };

  roads.forEach((road) => {

    const y = road.y ?? 0;

    // WATER LINE
    utilities.water.push({
      start: { x: road.minX, y: y },
      end: { x: road.maxX, y: y }
    });

    // SEWER LINE
    utilities.sewer.push({
      start: { x: road.minX, y: y - 2 },
      end: { x: road.maxX, y: y - 2 }
    });

    // STORM DRAIN
    utilities.storm.push({
      start: { x: road.minX, y: y + 2 },
      end: { x: road.maxX, y: y + 2 }
    });

    // POWER LINE
    utilities.power.push({
      start: { x: road.minX, y: y + 4 },
      end: { x: road.maxX, y: y + 4 }
    });

  });

  return utilities;
}