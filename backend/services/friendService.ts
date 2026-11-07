import { CheckIn, Group, UserProfile } from "../types";
import { backend } from "./supabase";
import { watchQuery } from "./watchQuery";

export async function createGroup(name: string) {
  if (!name.trim() || name.trim().length > 60)
    throw new Error("Escribe un nombre de grupo entre 1 y 60 caracteres.");
  const { data, error } = await backend().rpc("create_group", {
    p_name: name.trim(),
  });
  if (error) throw error;
  return data as string;
}
export async function joinGroup(code: string) {
  const id = code.trim().toLowerCase();
  if (!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id))
    throw new Error("Revisa el código de invitación completo.");
  const { data, error } = await backend().rpc("join_group", { p_code: id });
  if (error) throw error;
  return data as string;
}
export async function getGroupId(uid: string) {
  const { data, error } = await backend()
    .from("profiles")
    .select("group_id")
    .eq("id", uid)
    .maybeSingle();
  if (error) throw error;
  return data?.group_id as string | undefined;
}
export const watchGroup = (
  id: string,
  next: (group: Group) => void,
  error: (e: unknown) => void,
) =>
  watchQuery(
    "groups",
    async () => {
      const { data, error } = await backend()
        .from("groups")
        .select("id,name,members,owner_id")
        .eq("id", id)
        .single();
      if (error) throw error;
      return {
        id: data.id,
        name: data.name,
        members: data.members,
        ownerId: data.owner_id,
      } as Group;
    },
    next,
    error,
    `id=eq.${id}`,
  );
export const watchCheckIns = (
  id: string,
  next: (items: CheckIn[]) => void,
  error: (e: unknown) => void,
) =>
  watchQuery(
    "checkins",
    async () => {
      const { data, error } = await backend()
        .from("checkins")
        .select("id,user_id,name,gym_id,created_at")
        .eq("group_id", id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data.map((r) => ({
        id: r.id,
        userId: r.user_id,
        name: r.name,
        gymId: r.gym_id,
        createdAt: r.created_at ? Date.parse(r.created_at) : null,
      })) as CheckIn[];
    },
    next,
    error,
    `group_id=eq.${id}`,
  );
export async function checkIn(
  groupId: string,
  gymId: string,
  user: UserProfile,
) {
  if (!gymId) throw new Error("Selecciona un gimnasio.");
  const { error } = await backend().from("checkins").insert({
    group_id: groupId,
    user_id: user.uid,
    name: user.name,
    gym_id: gymId,
  });
  if (error) throw error;
}
