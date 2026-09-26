// Inlines texture references in theme CSS as data URIs.
//
//   url("texture:grain.svg?c=6b4a26&o=0.3")
//
// reads css/textures/grain.svg, fills its {c} (color), {r} {g} {b} (color channels, 0-1)
// and {o} (opacity) placeholders, and returns url("data:image/svg+xml,...").
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REF = /url\(\s*["']texture:([\w-]+\.svg)(?:\?([^"']*))?["']\s*\)/g;

export function inlineTextures(css, texturesDir) {
  return css.replace(REF, (_, file, query = "") => {
    const params = new URLSearchParams(query);
    const hex = (params.get("c") ?? "000000").replace(/^#/, "");
    const channel = (i) => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(3);
    const fill = {
      c: `#${hex}`,
      r: channel(0),
      g: channel(2),
      b: channel(4),
      o: params.get("o") ?? "1",
    };
    const svg = readFileSync(join(texturesDir, file), "utf8")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/\{(\w)\}/g, (match, key) => fill[key] ?? match)
      .replace(/\s+/g, " ")
      .replace(/> </g, "><")
      .trim();
    return `url("data:image/svg+xml,${encodeSvg(svg)}")`;
  });
}

// Minimal escaping that keeps the SVG readable in devtools and is valid inside url("...").
function encodeSvg(svg) {
  return svg
    .replace(/"/g, "'")
    .replace(/%/g, "%25")
    .replace(/#/g, "%23")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E");
}
