import type { CSSProperties, SVGProps } from "react";
import { DRAWN_PIECES } from "./emblem-drawn";
import { EMBLEM_PIECES, type EmblemPiece } from "./emblem-paths";
import type { ThemeName } from "./themes";

// Each theme's sigil, traced from assets/sigils.png by scripts/trace-emblems.mjs and split into
// its pieces. Drawn in currentColor, so it takes the color of the text around it. The motion
// (each piece moving in turn, in the theme's manner) lives in base.css.

export type EmblemAnimation =
  /** The pieces come in one after another, in the theme's manner: Eden's petals unfold, Babel's
   *  blocks stack, Furnace's flames kindle... Plays on mount; change the element's `key` to replay. */
  | "enter"
  /** A slow loop in the theme's own manner: Eden breathes, Furnace flickers, Galilee rocks... */
  | "idle"
  /** Enter, then idle. */
  | "enter-idle"
  /** Idle only while the sigil, or the link or button around it, is hovered or focused. */
  | "hover";

type Order = (p: EmblemPiece) => number;

// The order each theme's pieces come in (the frame always leads).
const angle: Order = ([, x, y]) => (Math.atan2(x - 50, 50 - y) + 2 * Math.PI) % (2 * Math.PI);
const bottomUp: Order = ([, , y]) => -y;
const leftRight: Order = ([, x]) => x;
const centerOut: Order = ([, x, y]) => Math.hypot(x - 50, y - 50);
const outsideIn: Order = ([, x, y]) => -Math.hypot(x - 50, y - 50);
const ORDER: Record<ThemeName, Order> = {
  eden: angle,
  exile: outsideIn,
  deluge: bottomUp,
  babel: bottomUp,
  jericho: angle,
  shepherd: bottomUp,
  "big-fish": bottomUp,
  furnace: bottomUp,
  cana: outsideIn,
  galilee: centerOut,
  "empty-tomb": centerOut,
  pentecost: bottomUp,
  ekklesia: centerOut,
  zion: bottomUp,
};

// Traced sigils, with hand-drawn ones filling in for themes not on the artwork sheet yet.
const PIECES: Partial<Record<ThemeName, readonly EmblemPiece[]>> = { ...EMBLEM_PIECES, ...DRAWN_PIECES };

export interface ThemeEmblemProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  theme: ThemeName;
  /** Pixel size, or any CSS length. Defaults to 1em so it sits in a line of text. */
  size?: number | string;
  /** Accessible name. Without one the emblem is decorative and hidden from screen readers. */
  title?: string;
  /** Motion (needs goodthemes' CSS; off under prefers-reduced-motion). */
  animate?: EmblemAnimation;
}

/** The theme's sigil, in currentColor. */
export function ThemeEmblem({ theme, size = "1em", title, animate, style, ...props }: ThemeEmblemProps) {
  // A theme without a sigil yet renders an empty mark rather than failing.
  const pieces = PIECES[theme] ?? [];
  let body;
  if ((animate === "enter" || animate === "enter-idle") && pieces.length) {
    // Frame first, then the rest in the theme's order, each piece its own element.
    const [frame, ...rest] = pieces;
    const order = ORDER[theme];
    const sequence = [frame!, ...[...rest].sort((a, b) => order(a) - order(b))];
    body = sequence.map((p, i) => (
      <path
        key={i}
        d={p[0]}
        fillRule="evenodd"
        data-gt-piece={i === 0 ? "frame" : ""}
        style={{ "--i": i, "--dx": ((p[1] - 50) / 50).toFixed(2), "--dy": ((p[2] - 50) / 50).toFixed(2) } as CSSProperties}
      />
    ));
  } else {
    // Each piece its own path: pieces may overlap (hand-drawn sigils do), and separate paths
    // union where one even-odd path would cut holes.
    body = pieces.map((p, i) => <path key={i} d={p[0]} fillRule="evenodd" />);
  }
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="currentColor"
      data-gt-emblem={theme}
      data-gt-animate={animate}
      style={{ "--gt-n": pieces.length, ...style } as CSSProperties}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
      {...props}
    >
      {body}
    </svg>
  );
}
