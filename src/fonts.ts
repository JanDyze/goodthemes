import { themes, type ThemeName } from "./themes";

const faces = (theme: ThemeName) => {
  const { display, body } = themes[theme].fonts;
  return [`400 1em "${display}"`, `400 1em "${body}"`];
};

/**
 * Adds the theme's Google Fonts stylesheet to <head> (once), then starts downloading the
 * font files themselves. A stylesheet alone only declares faces; browsers fetch the files
 * on first use, which would otherwise happen in the middle of a theme switch.
 */
export function ensureFonts(theme: ThemeName) {
  const existing = document.querySelector<HTMLLinkElement>(`link[data-gt-fonts="${theme}"]`);
  if (existing) return;
  for (const origin of ["https://fonts.googleapis.com", "https://fonts.gstatic.com"]) {
    if (document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) continue;
    const pre = document.createElement("link");
    pre.rel = "preconnect";
    pre.href = origin;
    if (origin.includes("gstatic")) pre.crossOrigin = "";
    document.head.appendChild(pre);
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = themes[theme].fonts.href;
  link.setAttribute("data-gt-fonts", theme);
  link.addEventListener("load", () => {
    for (const face of faces(theme)) document.fonts.load(face).catch(() => {});
  });
  document.head.appendChild(link);
}

/** Resolves once the theme's faces are usable, or after `timeout` ms, whichever is first. */
export async function fontsReady(theme: ThemeName, timeout = 280) {
  const wanted = faces(theme);
  // Already downloaded: nothing to wait for.
  if (wanted.every((face) => document.fonts.check(face))) return;
  const load = Promise.all(wanted.map((face) => document.fonts.load(face)));
  await Promise.race([load.catch(() => {}), new Promise((done) => setTimeout(done, timeout))]);
}
