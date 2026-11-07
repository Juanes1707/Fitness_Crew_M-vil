export const palettes = {
  light: {
    background: "#F3F6FC",
    surface: "#FFFFFF",
    text: "#142440",
    muted: "#475976",
    primary: "#1745B8",
    onPrimary: "#FFFFFF",
    border: "#B3BED2",
    error: "#A01D31",
  },
  dark: {
    background: "#101A2B",
    surface: "#1C2B43",
    text: "#F3F6FC",
    muted: "#B8C7DF",
    primary: "#B3CAFF",
    onPrimary: "#10234C",
    border: "#70839F",
    error: "#FFB3C0",
  },
};
export const levels = {
  empty: { label: "Vacío", icon: "○" },
  medium: { label: "Medio", icon: "◐" },
  full: { label: "Lleno", icon: "●" },
} as const;
