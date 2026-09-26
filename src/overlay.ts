import type { ThemeName } from "./themes";

/*
 * Theme switches are an overlay: a layer painted in the incoming theme covers the page, the
 * theme is swapped underneath while nothing can see it, and the layer leaves. Only that one
 * layer moves, and only by transform and opacity, which the compositor animates on its own,
 * so the switch stays smooth however busy the page is. The layer's geometry (edges, masks, doors) lives in base.css; its motion is here.
 */

export type Effect = ThemeName | "none";

/** Where the switch was triggered, and how far it is from there to the farthest corner. */
export interface Origin {
  x: number;
  y: number;
  reach: number;
}

type Target = "self" | "sigil" | "a" | "b" | "shape" | "tiles";

interface Step {
  target: Target;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  /** For "tiles": each tile starts at a random moment within this many ms. */
  scatter?: number;
}

interface Plan {
  enter(o: Origin): Step[];
  exit(o: Origin): Step[];
}

const step = (target: Target, keyframes: Keyframe[], duration: number, easing: string, delay = 0): Step => ({
  target,
  keyframes,
  options: { duration, easing, delay, fill: "both" },
});

const sigilOut = step("sigil", [{ opacity: 1 }, { opacity: 0 }], 200, "ease-in");

const fadeOut = (duration = 340): Step[] => [step("self", [{ opacity: 1 }, { opacity: 0 }], duration, "ease-in")];

const plans: Record<Effect, Plan> = {
  // A bloom from wherever you touched.
  "first-garden": {
    enter: () => [step("shape", [{ transform: "scale(0)" }, { transform: "scale(1)" }], 540, "cubic-bezier(0.3, 0.9, 0.3, 1)")],
    exit: () => fadeOut(360),
  },
  // A wind front crosses the screen and carries on out the other side.
  exile: {
    enter: () => [step("self", [{ transform: "translateX(-100%)" }, { transform: "translateX(0)" }], 560, "cubic-bezier(0.55, 0.05, 0.25, 1)")],
    exit: () => [step("self", [{ transform: "translateX(0)" }, { transform: "translateX(100%)" }], 520, "cubic-bezier(0.6, 0, 0.4, 1)")],
  },
  // The water rises over everything, then goes down again.
  "great-flood": {
    enter: () => [step("self", [{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], 640, "cubic-bezier(0.45, 0.05, 0.3, 1)")],
    exit: () => [step("self", [{ transform: "translateY(0)" }, { transform: "translateY(100%)" }], 560, "cubic-bezier(0.55, 0, 0.45, 1)")],
  },
  // Laid course by course from the ground up.
  "unfinished-tower": {
    enter: () => [step("self", [{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], 560, "steps(9, end)")],
    exit: () => fadeOut(340),
  },
  // The wall comes down over the old theme, then falls flat.
  "fallen-walls": {
    enter: () => [step("self", [{ transform: "translateY(-100%)" }, { transform: "translateY(0)" }], 420, "cubic-bezier(0.7, 0, 0.84, 0)")],
    exit: () => [step("self", [{ transform: "translateY(0)" }, { transform: "translateY(100%)" }], 560, "cubic-bezier(0.55, 0, 1, 0.45)")],
  },
  // The hills rise gently over the page, then the view clears.
  shepherd: {
    enter: () => [step("self", [{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], 720, "cubic-bezier(0.35, 0.1, 0.25, 1)")],
    exit: () => fadeOut(420),
  },
  // Swallowed: two jaws close from above and below, then open on the new theme.
  swallowed: {
    enter: () => [
      step("a", [{ transform: "translateY(-100%)" }, { transform: "translateY(0)" }], 500, "cubic-bezier(0.6, 0, 0.4, 1)"),
      step("b", [{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], 500, "cubic-bezier(0.6, 0, 0.4, 1)"),
    ],
    exit: () => [
      sigilOut,
      step("a", [{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }], 560, "cubic-bezier(0.4, 0, 0.1, 1)", 80),
      step("b", [{ transform: "translateY(0)" }, { transform: "translateY(100%)" }], 560, "cubic-bezier(0.4, 0, 0.1, 1)", 80),
    ],
  },
  // Flames run up the screen; the heat fades off.
  furnace: {
    enter: () => [step("self", [{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], 460, "cubic-bezier(0.5, 0, 0.3, 1)")],
    exit: () => [step("self", [{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(-6%)" }], 380, "ease-in")],
  },
  // Two doors close on the old theme and open onto the feast.
  "good-wine": {
    enter: () => [
      step("a", [{ transform: "translateX(-100%)" }, { transform: "translateX(0)" }], 480, "cubic-bezier(0.4, 0, 0.1, 1)"),
      step("b", [{ transform: "translateX(100%)" }, { transform: "translateX(0)" }], 480, "cubic-bezier(0.4, 0, 0.1, 1)"),
    ],
    exit: () => [
      sigilOut,
      step("a", [{ transform: "translateX(0)" }, { transform: "translateX(-100%)" }], 580, "cubic-bezier(0.4, 0, 0.1, 1)", 80),
      step("b", [{ transform: "translateX(0)" }, { transform: "translateX(100%)" }], 580, "cubic-bezier(0.4, 0, 0.1, 1)", 80),
    ],
  },
  // A ripple from where you touched the water, settling as it goes.
  "fishers-of-men": {
    enter: () => [step("shape", [{ transform: "scale(0)" }, { transform: "scale(1)" }], 640, "cubic-bezier(0.25, 0.1, 0.25, 1)")],
    exit: () => [step("self", [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.03)" }], 420, "ease-in")],
  },
  // The stone: rolled across to cover the page, then rolled away off the other side.
  "empty-tomb": {
    enter: () => [step("shape", [{ transform: "translateX(-130vw) rotate(-220deg)" }, { transform: "translateX(0) rotate(0deg)" }], 780, "cubic-bezier(0.3, 0.1, 0.2, 1)")],
    exit: () => [
      sigilOut,
      step("shape", [{ transform: "translateX(0) rotate(0deg)" }, { transform: "translateX(130vw) rotate(220deg)" }], 820, "cubic-bezier(0.55, 0, 0.85, 0.35)"),
    ],
  },
  // A gust: in from one side, leaning into the wind, and out the other.
  "mighty-wind": {
    enter: () => [step("self", [{ transform: "translateX(-100%) skewX(-14deg)" }, { transform: "translateX(0) skewX(0deg)" }], 440, "cubic-bezier(0.16, 1, 0.3, 1)")],
    exit: () => [step("self", [{ transform: "translateX(0) skewX(0deg)" }, { transform: "translateX(100%) skewX(-14deg)" }], 400, "cubic-bezier(0.7, 0, 0.84, 0)")],
  },
  // The city opens like a cut gem.
  "pearl-gates": {
    enter: () => [step("shape", [{ transform: "rotate(45deg) scale(0)" }, { transform: "rotate(45deg) scale(1)" }], 580, "cubic-bezier(0.22, 1, 0.36, 1)")],
    exit: () => fadeOut(360),
  },
  // Mosaic tiles set down in a scattered order until the page is covered, then lifted.
  ekklesia: {
    enter: () => [
      {
        target: "tiles",
        keyframes: [{ opacity: 0, transform: "scale(0) rotate(45deg)" }, { opacity: 1, transform: "scale(1.03)" }],
        options: { duration: 260, easing: "cubic-bezier(0.3, 0.7, 0.3, 1)", fill: "both" },
        scatter: 440,
      },
    ],
    exit: () => [
      {
        target: "tiles",
        keyframes: [{ opacity: 1, transform: "scale(1.03)" }, { opacity: 0, transform: "scale(0) rotate(-45deg)" }],
        options: { duration: 240, easing: "cubic-bezier(0.5, 0, 0.8, 0.4)", fill: "both" },
        scatter: 400,
      },
      sigilOut,
    ],
  },
  // No theme: a plain crossfade.
  none: {
    enter: () => [step("self", [{ opacity: 0 }, { opacity: 1 }], 220, "ease-out")],
    exit: () => fadeOut(260),
  },
};

/**
 * Sizes the overlay's shape for effects that grow one: a circle centered where the switch was
 * triggered, reaching the farthest corner (First Garden, Fishers of Men), or a diamond covering the screen
 * from its center (Pearl Gates). Growing a shape by transform stays on the compositor; animating
 * clip-path would not.
 */
function placeShape(el: HTMLElement, effect: Effect, o: Origin) {
  const shape = el.querySelector<HTMLElement>("[data-gt-shape]");
  if (!shape) return;
  const centered = effect === "pearl-gates" || effect === "empty-tomb";
  const size = centered ? Math.hypot(innerWidth, innerHeight) * 1.04 : o.reach * 2;
  const [cx, cy] = centered ? [innerWidth / 2, innerHeight / 2] : [o.x, o.y];
  Object.assign(shape.style, { width: `${size}px`, height: `${size}px`, left: `${cx - size / 2}px`, top: `${cy - size / 2}px` });
}

/** Plays one phase on the overlay element. Resolves when done; rejects if cancelled. */
export function play(el: HTMLElement, effect: Effect, phase: "enter" | "exit", origin: Origin, running: Animation[]): Promise<unknown> {
  if (phase === "enter") placeShape(el, effect, origin);
  const find = (target: Target): Element | null => {
    if (target === "self") return el;
    if (target === "sigil") return el.querySelector("[data-gt-emblem]");
    if (target === "shape") return el.querySelector("[data-gt-shape]");
    return el.querySelector(`[data-gt-panel="${target}"]`);
  };
  const animations = plans[effect][phase](origin).flatMap(({ target, keyframes, options, scatter = 0 }) => {
    if (target === "tiles") {
      const base = Number(options.delay ?? 0);
      return [...el.querySelectorAll("[data-gt-tile]")].map((tile) =>
        tile.animate(keyframes, { ...options, delay: base + Math.random() * scatter }),
      );
    }
    const node = find(target);
    return node ? [node.animate(keyframes, options)] : [];
  });
  running.push(...animations);
  return Promise.all(animations.map((a) => a.finished));
}

/** Two animation frames: long enough for the swapped theme to have been styled and painted. */
export const settle = () => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done())));
