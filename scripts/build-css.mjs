// Builds dist/*.css: each source file with its textures inlined, plus styles.css (all of them).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { inlineTextures } from "./textures.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "css");
const out = join(root, "dist");
const files = ["base.css", "exile.css", "first-garden.css", "great-flood.css", "unfinished-tower.css", "fallen-walls.css", "shepherd.css", "swallowed.css", "furnace.css", "good-wine.css", "fishers-of-men.css", "empty-tomb.css", "mighty-wind.css", "ekklesia.css", "pearl-gates.css"];

mkdirSync(out, { recursive: true });

const built = files.map((file) => {
  const css = inlineTextures(readFileSync(join(src, file), "utf8"), join(src, "textures"));
  writeFileSync(join(out, file), css);
  return css;
});

writeFileSync(join(out, "styles.css"), built.join("\n"));
console.log(`goodthemes: wrote ${files.length + 1} stylesheets to dist/`);
