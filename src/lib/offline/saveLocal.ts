import { dbPromise } from "./db";

export const savePointsLocal = async (points: any[]) => {
  const db = await dbPromise;
  const tx = db.transaction("points", "readwrite");

  for (const pt of points) {
    await tx.store.put({
      ...pt,
      synced: false,
    });
  }

  await tx.done;
};