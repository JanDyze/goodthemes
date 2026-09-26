import { createContext, useContext } from "react";
import type { Mode, ResolvedMode, ThemeInfo, ThemeName } from "./themes";

/** Where a switch starts from: a click event, an element (its center), or a point. */
export type TransitionOrigin =
  | { clientX: number; clientY: number; currentTarget?: EventTarget | null }
  | Element
  | { x: number; y: number };

export interface SwitchOptions {
  /** Set false to switch instantly, e.g. when restoring a theme from the URL on page load. */
  transition?: boolean;
}

export interface ThemeContextValue {
  /** The active theme, or null when the app's own look is showing. */
  theme: ThemeName | null;
  info: ThemeInfo | null;
  mode: Mode;
  resolvedMode: ResolvedMode;
  ambient: boolean;
  decor: boolean;
  themes: ThemeInfo[];
  /** Switch themes. Pass the click event to start the transition from the pointer. */
  setTheme(theme: ThemeName | null, origin?: TransitionOrigin, options?: SwitchOptions): void;
  setMode(mode: Mode, origin?: TransitionOrigin, options?: SwitchOptions): void;
  setAmbient(on: boolean): void;
  setDecor(on: boolean): void;
  /** Starts loading a theme's fonts, e.g. when a switcher is hovered. */
  preload(theme: ThemeName): void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme() must be called inside <ThemeProvider>.");
  return ctx;
}

/** Like useTheme(), but returns null outside a provider instead of throwing. */
export function useOptionalTheme(): ThemeContextValue | null {
  return useContext(ThemeContext);
}
