import { dbPromise } from "./db";

export const loadPointsLocal = async () => {
  const db = await dbPromise;
  return await db.getAll("points");
};