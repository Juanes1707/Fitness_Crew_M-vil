import { Gym, Report } from "../types";
import { backend } from "./supabase";
import { watchQuery } from "./watchQuery";
export const watchGyms = (
  next: (gyms: Gym[]) => void,
  error: (e: unknown) => void,
) =>
  watchQuery(
    "gyms",
    async () => {
      const { data, error } = await backend()
        .from("gyms")
        .select("id,name,address")
        .order("name");
      if (error) throw error;
      return data as Gym[];
    },
    next,
    error,
  );
export const watchReports = (
  gymId: string,
  next: (reports: Report[]) => void,
  error: (e: unknown) => void,
) =>
  watchQuery(
    "reports",
    async () => {
      const { data, error } = await backend()
        .from("reports")
        .select("id,gym_id,user_id,level,photo_path,created_at")
        .eq("gym_id", gymId)
        .order("created_at", { ascending: false })
        .order("id")
        .limit(100);
      if (error) throw error;
      return data.map((r) => ({
        id: r.id,
        gymId: r.gym_id,
        userId: r.user_id,
        level: r.level,
        photoPath: r.photo_path,
        createdAt: r.created_at ? Date.parse(r.created_at) : null,
      })) as Report[];
    },
    next,
    error,
    `gym_id=eq.${gymId}`,
  );
