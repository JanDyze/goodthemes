// Empties dist/ without removing the folder itself, so file watchers on it (the playground's) keep working.
import { mkdirSync, readdirSync, rmSync } from "node:fs";

mkdirSync("dist", { recursive: true });
for (const entry of readdirSync("dist")) rmSync(`dist/${entry}`, { recursive: true, force: true });
