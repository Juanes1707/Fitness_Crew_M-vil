import { Redirect } from "expo-router";
import { useAppSelector } from "../src/hooks/store";
export default function Index() {
  const user = useAppSelector((s) => s.auth.user);
  return <Redirect href={user ? "/(tabs)" : "/login"} />;
}
