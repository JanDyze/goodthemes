import { DEFAULT_STORAGE_KEY, themes, type Mode, type ThemeName } from "./themes";

export interface ThemeScriptOptions {
  storageKey?: string;
  /** Theme used until the visitor picks one. `null` keeps the app's own look. */
  defaultTheme?: ThemeName | null;
  defaultMode?: Mode;
  /** Texture, display headings and component touches. */
  decor?: boolean;
  /** Load each theme's Google Fonts stylesheet. */
  fonts?: boolean;
}

interface BootConfig {
  k: string;
  t: ThemeName | null;
  m: Mode;
  d: boolean;
  f: boolean;
  h: Record<string, string>;
}

// Runs inline in <head>, before first paint. Kept dependency-free and ES5-safe
// because it is serialized with Function.prototype.toString.
function boot(c: BootConfig) {
  try {
    var s: Record<string, unknown> = {};
    try {
      s = JSON.parse(localStorage.getItem(c.k) || "{}") || {};
    } catch (e) {}
    var t = "theme" in s ? (s.theme as string | null) : c.t;
    if (t && !c.h[t]) t = c.t;
    var m = (s.mode as string) || c.m;
    var dark = m === "dark" || (m === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    var decor = "decor" in s ? s.decor !== false : c.d;
    var r = document.documentElement;
    if (t) r.setAttribute("data-theme", t);
    else r.removeAttribute("data-theme");
    r.classList.toggle("dark", dark);
    r.style.colorScheme = dark ? "dark" : "light";
    if (!decor) r.setAttribute("data-gt-decor", "off");
    if (t && c.f && !document.querySelector('link[data-gt-fonts="' + t + '"]')) {
      var l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = c.h[t]!;
      l.setAttribute("data-gt-fonts", t);
      document.head.appendChild(l);
    }
  } catch (e) {}
}

/** The boot script's source, for frameworks that want to place the <script> themselves. */
export function themeScript({
  storageKey = DEFAULT_STORAGE_KEY,
  defaultTheme = null,
  defaultMode = "system",
  decor = true,
  fonts = true,
}: ThemeScriptOptions = {}): string {
  const config: BootConfig = {
    k: storageKey,
    t: defaultTheme,
    m: defaultMode,
    d: decor,
    f: fonts,
    h: Object.fromEntries(Object.values(themes).map((theme) => [theme.id, theme.fonts.href])),
  };
  return `(${boot.toString()})(${JSON.stringify(config)})`;
}

/**
 * Put this in <head> so the saved theme is applied before the page paints.
 * Pass the same options you give <ThemeProvider>. Safe to render from a Server Component.
 */
export function ThemeScript(props: ThemeScriptOptions) {
  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeScript(props) }} />;
}
