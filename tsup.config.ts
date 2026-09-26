import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    dts: true,
    external: ["react", "react-dom"],
    // Everything here touches the DOM, so the entry is a client module for React Server Components.
    banner: { js: '"use client";' },
  },
  {
    // Server-safe: the boot script and theme metadata, importable from a Server Component.
    entry: { script: "src/server.ts" },
    format: ["esm"],
    dts: true,
    external: ["react", "react-dom"],
  },
]);
