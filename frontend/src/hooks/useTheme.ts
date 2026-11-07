import { useColorScheme } from "react-native";
import { palettes } from "../constants/theme";
import { useAppSelector } from "./store";
export function useTheme() {
  const system = useColorScheme();
  const mode = useAppSelector((s) => s.preferences.theme);
  const dark = (mode === "system" ? system : mode) === "dark";
  return { ...palettes[dark ? "dark" : "light"], dark };
}
