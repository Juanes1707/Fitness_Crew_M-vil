export type Level = "empty" | "medium" | "full";
export type UserProfile = { uid: string; email: string; name: string };
export type Gym = { id: string; name: string; address: string };
export type Report = {
  id: string;
  gymId: string;
  userId: string;
  level: Level;
  photoPath: string;
  createdAt: number | null;
};
export type PendingReport = {
  id: string;
  gymId: string;
  userId: string;
  level: Level;
  photoUri: string;
  capturedAt: number;
};
export type Group = {
  id: string;
  name: string;
  members: string[];
  ownerId: string;
};
export type CheckIn = {
  id: string;
  userId: string;
  name: string;
  gymId: string;
  createdAt: number | null;
};
