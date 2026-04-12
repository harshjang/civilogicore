export type SnapMode = "endpoint" | "midpoint" | "nearest";

export interface SnapPoint {
  x: number;
  y: number;
  z: number;
}

const SNAP_TOLERANCE = 2; // meters (adjust later)

export function getSnapPoint(
  mouse: SnapPoint,
  points: SnapPoint[],
  mode: SnapMode
): SnapPoint | null {

  let best: SnapPoint | null = null;
  let minDist = Infinity;

  const dist = (a: SnapPoint, b: SnapPoint) =>
    Math.sqrt(
      (a.x - b.x) ** 2 +
      (a.y - b.y) ** 2 +
      (a.z - b.z) ** 2
    );

  // 🔹 ENDPOINT SNAP
  if (mode === "endpoint") {
    for (const p of points) {
      const d = dist(mouse, p);
      if (d < SNAP_TOLERANCE && d < minDist) {
        minDist = d;
        best = p;
      }
    }
  }

  // 🔹 MIDPOINT SNAP
  if (mode === "midpoint") {
    for (let i = 0; i < points.length - 1; i++) {
      const mid = {
        x: (points[i].x + points[i + 1].x) / 2,
        y: (points[i].y + points[i + 1].y) / 2,
        z: (points[i].z + points[i + 1].z) / 2,
      };

      const d = dist(mouse, mid);
      if (d < SNAP_TOLERANCE && d < minDist) {
        minDist = d;
        best = mid;
      }
    }
  }

  // 🔹 NEAREST SNAP
  if (mode === "nearest") {
    for (const p of points) {
      const d = dist(mouse, p);
      if (d < minDist) {
        minDist = d;
        best = p;
      }
    }
  }

  return best;
}