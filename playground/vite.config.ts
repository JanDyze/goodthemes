import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const buildCss = () => {
  execFileSync(process.execPath, ["scripts/build-css.mjs"], { cwd: root, stdio: "inherit" });
};

// The playground consumes dist/*.css exactly as an app would; this keeps it fresh while editing css/.
function themeCss(): Plugin {
  return {
    name: "goodthemes-css",
    buildStart: buildCss,
    configureServer(server) {
      // Editing a theme source rebuilds dist/, which main.tsx imports, so Vite hot-reloads it.
      server.watcher.add(`${root}css`);
      server.watcher.on("all", (_event, file) => {
        if (file.replaceAll("\\", "/").includes("/css/")) buildCss();
      });
    },
  };
}

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [themeCss(), react(), tailwindcss()],
  resolve: {
    alias: { goodthemes: fileURLToPath(new URL("../src/index.ts", import.meta.url)) },
  },
  server: { port: 5178 },
});
