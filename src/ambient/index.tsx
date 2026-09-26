import { useEffect, useRef, useSyncExternalStore } from "react";
import { useOptionalTheme } from "../context";
import { themes, type AmbientScene } from "../themes";
import { startScene } from "./engine";

export interface AmbientProps {
  /** Force a scene. By default it follows the active theme and mode. */
  scene?: AmbientScene;
  /** "back" sits behind page content (needs a transparent <html> background); "front" floats over it. */
  layer?: "back" | "front";
  /** Multiplies the particle count. 1 is the designed density. */
  density?: number;
}

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (notify: () => void) => {
  const mq = window.matchMedia(reducedQuery);
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
};

/** A full-screen canvas playing the theme's ambient scene. Renders nothing under reduced motion. */
export function Ambient({ scene: forced, layer = "back", density = 1 }: AmbientProps) {
  const ctx = useOptionalTheme();
  const scene = forced ?? (ctx?.theme ? themes[ctx.theme].ambient[ctx.resolvedMode] : undefined);
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => true);
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!scene || reduced || !canvas) return;
    let stop: (() => void) | undefined;
    const root = document.documentElement;
    const begin = () => {
      stop = startScene(canvas, scene, { density });
    };
    if (!root.hasAttribute("data-gt-transition")) {
      begin();
      return () => stop?.();
    }
    const watch = new MutationObserver(() => {
      if (root.hasAttribute("data-gt-transition")) return;
      watch.disconnect();
      begin();
    });
    watch.observe(root, { attributeFilter: ["data-gt-transition"] });
    return () => {
      watch.disconnect();
      stop?.();
    };
  }, [scene, reduced, density]);

  if (!scene || reduced) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      data-gt-ambient={scene}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: layer === "back" ? -1 : 2147483000,
        opacity: layer === "front" ? 0.7 : 1,
      }}
    />
  );
}
