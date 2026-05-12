import { dbPromise } from "./db";
import { supabase } from "@/lib/supabase";

export const syncPoints = async (userId: string, projectId?: string) => {
  const db = await dbPromise;
  const all = await db.getAll("points");

  const unsynced = all.filter((p: any) => !p.synced);

  for (const pt of unsynced) {
    const { error } = await supabase.from("survey_points").upsert({
      id: pt.id,
      user_id: userId,
      project_id: projectId || null,
      point_no: pt.pointNo,
      easting: parseFloat(pt.easting),
      northing: parseFloat(pt.northing),
      elevation: parseFloat(pt.elevation),
      code: pt.code,
      layer: pt.layer,
    });

    if (!error) {
      pt.synced = true;
      await db.put("points", pt);
    }
  }
};
