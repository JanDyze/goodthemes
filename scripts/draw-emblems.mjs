// Draws the placeholder sigils (themes not on the traced artwork sheet yet) and writes
// src/emblem-drawn.ts. Everything is built from polygons on the sigils' 100 x 100 grid, with the
// same heavy strokes as the traced set.
//
//   node scripts/draw-emblems.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const f = (n) => +n.toFixed(1);
const TAU = Math.PI * 2;

/** One closed contour from points. */
const contour = (pts) => `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(" L")} Z`;

/** A piece: its contours (a shape and any holes), with bounds computed from the points. */
function piece(...shapes) {
  const pts = shapes.flat();
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return [shapes.map(contour).join(" "), f((x0 + x1) / 2), f((y0 + y1) / 2), f(x1 - x0), f(y1 - y0)];
}

/** Points around a circle (or an arc from a to b, in radians). */
const arc = (cx, cy, r, a = 0, b = TAU, steps = 40) =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const t = a + ((b - a) * i) / steps;
    return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
  });

/** A bar from p to q with the given width and round ends. */
function bar([x1, y1], [x2, y2], w) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  return [...arc(x2, y2, w / 2, a - Math.PI / 2, a + Math.PI / 2, 10), ...arc(x1, y1, w / 2, a + Math.PI / 2, a + (3 * Math.PI) / 2, 10)];
}

/** A pointed leaf centered at (cx, cy), pointing along angle a. */
function leaf(cx, cy, a, len, width) {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * TAU;
    // A lens: sharp at both tips, full in the middle.
    const x = (Math.cos(t) * len) / 2;
    const y = Math.sin(t) * (width / 2) * Math.abs(Math.sin(t)) ** 0.2;
    pts.push([cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]);
  }
  return pts;
}

/** A four-pointed star. */
const star4 = (cx, cy, r, inner = 0.3) =>
  Array.from({ length: 8 }, (_, i) => {
    const t = -Math.PI / 2 + (i * Math.PI) / 4;
    const rr = i % 2 ? r * inner : r;
    return [cx + rr * Math.cos(t), cy + rr * Math.sin(t)];
  });

const rotate = (pts, [ox, oy], a) =>
  pts.map(([x, y]) => [ox + (x - ox) * Math.cos(a) - (y - oy) * Math.sin(a), oy + (x - ox) * Math.sin(a) + (y - oy) * Math.cos(a)]);

/* ---- Shepherd: the rod and the staff, crossed; a star over still waters ---- */

function shepherd() {
  // A shield: flat top edges rising to a point, sides curving down to a point.
  const shield = (inset) => {
    const top = [
      [50, 3 + inset * 1.05],
      [90 - inset, 13 + inset * 0.85],
    ];
    const side = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      // Cubic from (90-inset, 50) through (90-inset, 74) and (72, 90) to (50, 97-inset).
      const p0 = [90 - inset, 50], p1 = [90 - inset, 74 - inset * 0.6], p2 = [72 - inset * 0.3, 90 - inset], p3 = [50, 97 - inset * 1.1];
      const u = 1 - t;
      side.push([
        u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
        u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
      ]);
    }
    const right = [...top, ...side];
    const left = right.slice(1).reverse().map(([x, y]) => [100 - x, y]);
    return [...right, ...left.slice(1)];
  };
  const outer = shield(0);
  const inner = shield(5.5);
  // Half-width of the shield's interior at height y, for trimming the water bands to it.
  const interior = (y) => {
    let best = null;
    for (let i = 0; i < inner.length - 1; i++) {
      const [a, b] = [inner[i], inner[i + 1]];
      if ((a[1] - y) * (b[1] - y) <= 0 && a[0] >= 50 && b[0] >= 50) {
        const x = a[0] + ((y - a[1]) / (b[1] - a[1] || 1)) * (b[0] - a[0]);
        best = Math.max(best ?? 0, x - 50);
      }
    }
    return best ?? 0;
  };
  const band = (y0, amp, thick) => {
    const w = interior(y0 + thick) + 1.2;
    const top = [], bottom = [];
    for (let x = 50 - w; x <= 50 + w + 0.01; x += 1) {
      const y = y0 + amp * Math.sin(((x - 50) / 16) * TAU);
      top.push([x, y]);
      bottom.unshift([x, y + thick]);
    }
    return [...top, ...bottom];
  };

  // The staff: a crook, leaning in from the right, its hook curling toward the center.
  const lean = Math.atan2(-0.6, -0.8) - Math.atan2(-1, 0); // from straight up to up-and-left
  const base = [66, 71];
  const len = 40;
  const w = 6;
  const hookR = 8;
  const local = [
    [base[0] - w / 2, base[1]],
    [base[0] - w / 2, base[1] - len],
    ...arc(base[0] + hookR, base[1] - len, hookR + w / 2, Math.PI, TAU, 24),
    [base[0] + hookR * 2 + w / 2, base[1] - len + 5],
    ...arc(base[0] + hookR * 2, base[1] - len + 5, w / 2, 0, Math.PI, 8),
    ...arc(base[0] + hookR, base[1] - len, hookR - w / 2, TAU, Math.PI, 24),
    [base[0] + w / 2, base[1]],
    ...arc(base[0], base[1], w / 2, 0, Math.PI, 8),
  ];
  const crook = rotate(local, base, lean);
  // The rod: straight, mirrored across the center, with a knob at its head.
  const rodTop = [100 - (base[0] + Math.sin(-lean) * 0 - len * Math.sin(lean) * -1), 0];
  const rodFrom = [100 - base[0], base[1]];
  const dir = [-(crook[1][0] - crook[0][0]), crook[1][1] - crook[0][1]];
  const norm = Math.hypot(...dir);
  const rodTo = [rodFrom[0] + (dir[0] / norm) * (len + 1), rodFrom[1] + (dir[1] / norm) * (len + 1)];
  void rodTop;
  const rod = bar(rodFrom, rodTo, w);
  const knob = arc(rodTo[0] + (dir[0] / norm) * 3, rodTo[1] + (dir[1] / norm) * 3, 5.5, 0, TAU, 28);

  return [
    piece(outer, inner),
    piece(crook),
    piece(rod),
    piece(knob),
    piece(star4(50, 17.5, 8, 0.28)),
    piece(star4(33, 24, 3.6, 0.35)),
    piece(star4(67, 24, 3.6, 0.35)),
    piece(band(74, 1.6, 4.6)),
    piece(band(82, 1.3, 4.2)),
  ];
}

/* ---- Ekklesia: the chi-rho in a wreath, in an octagon, tesserae at the corners ---- */

function ekklesia() {
  const oct = (r) => Array.from({ length: 8 }, (_, i) => {
    const t = Math.PI / 8 + (i * Math.PI) / 4;
    return [50 + r * Math.cos(t), 50 + r * Math.sin(t)];
  });
  const pieces = [piece(oct(47), oct(41.5))];

  // Chi-rho: X low, the P's loop above it.
  const W = 6;
  pieces.push(piece(bar([38.5, 46.5], [61.5, 69.5], W)));
  pieces.push(piece(bar([61.5, 46.5], [38.5, 69.5], W)));
  pieces.push(piece(bar([50, 30], [50, 76], W)));
  pieces.push(piece(arc(55.2, 34.5, 8.6, -Math.PI, Math.PI, 40), arc(55.2, 34.5, 3.6, Math.PI, -Math.PI, 30)));

  // The wreath: two branches rising from a tie at the bottom, open at the top. Each branch is a
  // stem with leaves set close along it, alternating outside and inside.
  const cx = 50, cy = 52, R = 28.5;
  for (const side of [-1, 1]) {
    const from = ((90 + side * 10) * Math.PI) / 180;
    const to = ((90 + side * 158) * Math.PI) / 180;
    const stem = [...arc(cx, cy, R + 1.1, from, to, 36), ...arc(cx, cy, R - 1.1, to, from, 36)];
    pieces.push(piece(stem));
    for (let i = 0; i < 11; i++) {
      const deg = 90 + side * (16 + i * 13.2);
      const t = (deg * Math.PI) / 180;
      const out = i % 2 ? 1 : -1;
      const x = cx + (R + out * 3.6) * Math.cos(t);
      const y = cy + (R + out * 3.6) * Math.sin(t);
      // Each leaf leans along the branch toward the top, angled off the stem to its side.
      const along = t + side * (Math.PI / 2) - side * out * 0.55;
      pieces.push(piece(leaf(x, y, along, 11, 5.4)));
    }
  }
  pieces.push(piece(star4(50, 83, 3.4, 0.4)));

  // Tesserae in the four diagonal corners.
  for (const deg of [45, 135, 225, 315]) {
    const t = (deg * Math.PI) / 180;
    const [x, y] = [50 + 35.5 * Math.cos(t), 50 + 35.5 * Math.sin(t)];
    pieces.push(piece(rotate([[x - 2.1, y - 2.1], [x + 2.1, y - 2.1], [x + 2.1, y + 2.1], [x - 2.1, y + 2.1]], [x, y], Math.PI / 4)));
  }
  return pieces;
}

/* ---- Swallowed: a great fish arching over the waves, three lights in its belly ---- */

function bigFish() {
  // A wave-edged roundel.
  const outer = Array.from({ length: 169 }, (_, i) => {
    const t = (i / 168) * TAU;
    const r = 45.6 + 1.9 * Math.cos(t * 14);
    return [50 + r * Math.cos(t), 50 + r * Math.sin(t)];
  });
  const inner = arc(50, 50, 39.5, TAU, 0, 90);
  const cubic = (p0, p1, p2, p3, steps = 24) =>
    Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps;
      const u = 1 - t;
      return [0, 1].map((k) => u ** 3 * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t ** 3 * p3[k]);
    });
  // The body, nose left, tail right; the eye and the three lights are holes in it.
  const body = [
    ...cubic([17, 53], [20, 33], [51, 29], [73, 45.5]),
    [86, 33.5],
    [82, 50],
    [86, 64],
    ...cubic([73, 54.5], [51, 67], [23, 66], [17, 55]),
  ];
  const hole = (x, y, r) => arc(x, y, r, TAU, 0, 20);
  const fin = [...cubic([44, 33.5], [47, 27], [52, 24.5], [56, 24]), ...cubic([56, 24], [55, 28], [56, 31], [59, 34.5])];
  const interior = (y) => Math.sqrt(Math.max(0, 39.5 ** 2 - (y - 50) ** 2));
  const band = (y0, amp, thick) => {
    const w = interior(y0 + thick) + 1.2;
    const top = [], bottom = [];
    for (let x = 50 - w; x <= 50 + w + 0.01; x += 1) {
      const y = y0 + amp * Math.sin(((x - 50) / 15) * TAU);
      top.push([x, y]);
      bottom.unshift([x, y + thick]);
    }
    return [...top, ...bottom];
  };
  return [
    piece(outer, inner),
    piece(body, hole(26.5, 47.5, 2.3), hole(44, 52.5, 2.3), hole(51.5, 51.5, 2.3), hole(59, 52.5, 2.3)),
    piece(fin),
    piece(band(71, 1.7, 4.4)),
    piece(band(79, 1.4, 4.2)),
    piece(arc(25, 27, 2.8, 0, TAU, 20)),
    piece(arc(31, 20.5, 2, 0, TAU, 18)),
    piece(arc(24, 17.5, 1.5, 0, TAU, 14)),
  ];
}

/* ---- Empty Tomb: the rising sun's rays around a tomb in the hill, its stone rolled away ---- */

function emptyTomb() {
  const pieces = [piece(arc(50, 50, 40, 0, TAU, 90), arc(50, 50, 34.8, TAU, 0, 90))];
  // Sixteen rays, alternating long and short.
  for (let i = 0; i < 16; i++) {
    const t = (i / 16) * TAU - Math.PI / 2;
    const [r0, r1, half] = i % 2 ? [42, 46.5, 0.07] : [42, 49, 0.1];
    pieces.push(piece([
      [50 + r0 * Math.cos(t - half), 50 + r0 * Math.sin(t - half)],
      [50 + r1 * Math.cos(t), 50 + r1 * Math.sin(t)],
      [50 + r0 * Math.cos(t + half), 50 + r0 * Math.sin(t + half)],
    ]));
  }
  // The morning star over the hill (the frame itself is the rising sun).
  pieces.push(piece(star4(50, 33, 9, 0.26)));
  // The hill: everything inside the ring below a rounded crest. The doorway and the hollow the
  // stone sits in are cut out of it.
  const R = 34.8;
  const crest = Array.from({ length: 41 }, (_, i) => {
    const x = 15.5 + (69 * i) / 40;
    const u = (x - 50) / 34.5;
    return [x, 53 + 17.5 * u * u];
  });
  const [xl, xr] = [crest[0][0], crest.at(-1)[0]];
  const aR = Math.atan2(crest.at(-1)[1] - 50, xr - 50);
  const aL = Math.atan2(crest[0][1] - 50, xl - 50);
  const hill = [...crest, ...arc(50, 50, R, aR, aL > 0 ? aL : aL + TAU, 40)];
  const door = [[38.5, 77], [38.5, 66], ...arc(44, 66, 5.5, Math.PI, TAU, 16), [49.5, 77]].reverse();
  const hollow = arc(62.5, 71.5, 7.9, TAU, 0, 30);
  pieces.push(piece(hill, door, hollow));
  // The stone, rolled aside.
  pieces.push(piece(arc(62.5, 71.5, 6.1, 0, TAU, 30), arc(62.5, 71.5, 1.8, TAU, 0, 14)));
  return pieces;
}

const sets = { shepherd: shepherd(), ekklesia: ekklesia(), swallowed: bigFish(), "empty-tomb": emptyTomb() };
const body = Object.entries(sets)
  .map(([name, list]) => {
    const sorted = [...list].sort((a, b) => b[3] * b[4] - a[3] * a[4]);
    return `  ${JSON.stringify(name)}: [\n${sorted.map((p) => `    ${JSON.stringify(p)},`).join("\n")}\n  ],`;
  })
  .join("\n");

writeFileSync(
  join(root, "src/emblem-drawn.ts"),
  `// Generated by scripts/draw-emblems.mjs. Do not edit by hand.
import type { EmblemPiece } from "./emblem-paths";
import type { ThemeName } from "./themes";

/*
 * Placeholder sigils for themes that are not on the traced artwork sheet yet, in the same format
 * as the traced ones. When a theme's artwork is added to assets/sigils.png and NAMES in
 * scripts/trace-emblems.mjs, remove it from scripts/draw-emblems.mjs; the traced one takes over.
 *
 * Shepherd: the rod and the staff crossed (Psalm 23:4), a star over two bands of still water,
 * in a shield. Ekklesia: the chi-rho in a laurel wreath, in an octagon (the shape of the early
 * baptisteries), with tesserae at the corners. Swallowed: a great fish arching over the waves,
 * three lights in its belly for the three days, in a wave-edged roundel. Empty Tomb: the rising
 * sun's rays around a tomb in the hillside, its round stone rolled aside.
 */
export const DRAWN_PIECES: Partial<Record<ThemeName, readonly EmblemPiece[]>> = {
${body}
};
`,
);
for (const [name, list] of Object.entries(sets)) console.log(`${name}: ${list.length} pieces`);
