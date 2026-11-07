import { palettes } from "../frontend/src/constants/theme";
const luminance = (hex: string) => {
  const [r, g, b] = hex
    .replace("#", "")
    .match(/../g)!
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
};
for (const [mode, p] of Object.entries(palettes)) {
  for (const [front, back] of [
    [p.text, p.background],
    [p.text, p.surface],
    [p.muted, p.background],
    [p.muted, p.surface],
    [p.error, p.background],
    [p.primary, p.surface],
    [p.onPrimary, p.primary],
  ]) {
    test(`contraste ${mode} ${front}/${back} supera 4.5:1`, () => {
      const a = luminance(front);
      const b = luminance(back);
      expect(
        (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      ).toBeGreaterThanOrEqual(4.5);
    });
  }
}
