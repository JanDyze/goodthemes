// Server-safe entry (no "use client"): import from "goodthemes/script" in a Server Component layout.
export { ThemeScript, themeScript } from "./script";
export type { ThemeScriptOptions } from "./script";
export { ThemeEmblem } from "./emblem";
export type { EmblemAnimation, ThemeEmblemProps } from "./emblem";
export { themes, themeNames, isThemeName, passageUrl } from "./themes";
export type { AmbientScene, Inspiration, Mode, ResolvedMode, ThemeInfo, ThemeName } from "./themes";
