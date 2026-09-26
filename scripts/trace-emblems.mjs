// Traces the sigil artwork (assets/sigils.png: light marks on black laid out in a grid, each with
// its name below) into vector paths, and writes src/emblem-paths.ts. List the themes in NAMES in
// reading order (left to right, top to bottom); any number of rows and columns works.
//
//   node scripts/trace-emblems.mjs
//
// Each sigil is found as the union of the light shapes whose centers fall in its cell (the
// labels are left out), cropped square, upscaled for smoother curves, and traced with potrace.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Jimp from "jimp";
import potrace from "potrace";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const NAMES = ["eden", "exile", "deluge", "babel", "jericho", "furnace", "cana", "galilee", "pentecost", "zion"];
const UNITS = 100; // every path is written on a 100 x 100 grid
const UPSCALE = 3;

const image = await Jimp.read(join(root, "assets/sigils.png"));
const { width: W, height: H } = image.bitmap;
const light = new Uint8Array(W * H);
image.scan(0, 0, W, H, (x, y, i) => {
  const d = image.bitmap.data;
  light[y * W + x] = (d[i] + d[i + 1] + d[i + 2]) / 3 > 128 ? 1 : 0;
});

// Connected light regions (4-neighbour flood fill), with their bounding boxes.
const seen = new Uint8Array(W * H);
const label = new Int32Array(W * H); // region id per light pixel (0 = background)
const regions = [];
for (let start = 0; start < W * H; start++) {
  if (!light[start] || seen[start]) continue;
  let [x0, y0, x1, y1, n] = [W, H, 0, 0, 0];
  const id = regions.length + 1;
  const stack = [start];
  seen[start] = 1;
  while (stack.length) {
    const p = stack.pop();
    const x = p % W;
    const y = (p - x) / W;
    label[p] = id;
    n++;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
    for (const q of [p - 1, p + 1, p - W, p + W]) {
      if (q < 0 || q >= W * H || seen[q] || !light[q]) continue;
      if ((q === p - 1 && x === 0) || (q === p + 1 && x === W - 1)) continue;
      seen[q] = 1;
      stack.push(q);
    }
  }
  regions.push({ id, n, x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 });
}

// Frames are the outermost tall shapes. Group them into rows (a new row starts wherever the
// next frame begins below the current row's lowest edge), then read each row left to right.
const tall = regions.filter((r) => r.n > 12 && r.y1 - r.y0 > H * 0.06);
// Keep only outer frames: drop tall shapes that sit inside another's bounds (Eden's petals...).
const inside = (r, o) => o !== r && o.x0 <= r.x0 && o.x1 >= r.x1 && o.y0 <= r.y0 && o.y1 >= r.y1;
const big = tall.filter((r) => !tall.some((o) => inside(r, o)));
const rows = [];
for (const f of [...big].sort((a, b) => a.cy - b.cy)) {
  const row = rows.at(-1);
  if (row && f.y0 < Math.max(...row.map((r) => r.y1))) row.push(f);
  else rows.push([f]);
}
const found = rows.reduce((n, r) => n + r.length, 0);
if (found !== NAMES.length) throw new Error(`found ${found} sigils in ${rows.length} rows, but NAMES lists ${NAMES.length}`);

const out = {};
let next = 0;
for (const row of rows) {
  const frames = row.sort((a, b) => a.cx - b.cx);
  const bandBottom = Math.max(...frames.map((f) => f.y1));
  const bandTop = Math.min(...frames.map((f) => f.y0));
  for (const [col, frame] of frames.entries()) {
    const name = NAMES[next++];
    // Everything inside this sigil's column and band (its frame, and marks outside the frame).
    const left = col === 0 ? 0 : (frames[col - 1].x1 + frame.x0) / 2;
    const right = col === frames.length - 1 ? W : (frame.x1 + frames[col + 1].x0) / 2;
    const parts = regions.filter((r) => r.n > 12 && r.cx > left && r.cx < right && r.cy >= bandTop - 4 && r.cy <= bandBottom + 4);
    const own = new Set(parts.map((r) => r.id));
    const x0 = Math.min(...parts.map((r) => r.x0));
    const y0 = Math.min(...parts.map((r) => r.y0));
    const x1 = Math.max(...parts.map((r) => r.x1));
    const y1 = Math.max(...parts.map((r) => r.y1));
    // Square crop around the sigil with a small margin, clamped to the image.
    const side = Math.round(Math.max(x1 - x0, y1 - y0) * 1.04);
    const sx = Math.max(0, Math.round((x0 + x1) / 2 - side / 2));
    const sy = Math.max(0, Math.round((y0 + y1) / 2 - side / 2));
    const crop = image.clone().crop(sx, sy, Math.min(side, W - sx), Math.min(side, H - sy));
    // Blank every light pixel that belongs to a neighbour's shapes or a label. (Dim anti-aliased
    // pixels stay, so edges keep their smoothness; they fall below the threshold on their own.)
    crop.scan(0, 0, crop.bitmap.width, crop.bitmap.height, (x, y, i) => {
      const id = label[(y + sy) * W + (x + sx)];
      if (id && !own.has(id)) crop.bitmap.data.fill(0, i, i + 3);
    });
    crop.resize(crop.bitmap.width * UPSCALE, crop.bitmap.height * UPSCALE, Jimp.RESIZE_BICUBIC);
    const size = crop.bitmap.width;

    // potrace bundles its own Jimp, so hand it a PNG rather than this Jimp image.
    const png = await crop.getBufferAsync(Jimp.MIME_PNG);
    const svg = await new Promise((resolve, reject) =>
      potrace.trace(
        png,
        { threshold: 128, blackOnWhite: false, turdSize: 60, optTolerance: 0.35, alphaMax: 1, color: "#000" },
        (err, result) => (err ? reject(err) : resolve(result)),
      ),
    );
    const d = svg.match(/ d="([^"]+)"/)[1];
    // Rescale every coordinate onto the shared grid (potrace writes absolute M/C/L commands only).
    const k = UNITS / size;
    out[name] = d.replace(/-?\d+(\.\d+)?/g, (n) => String(+(Number(n) * k).toFixed(1))).replace(/\s+/g, " ").trim();
    console.log(`${name}: ${out[name].length} chars`);
  }
}

/*
 * Split each traced path into pieces, so sigils can animate part by part. A potrace path is a
 * list of closed contours; nesting decides what each one is. A contour inside an even number of
 * others is a solid shape; inside an odd number, it is a hole in its nearest container. A piece
 * is one solid shape together with its own holes, so it fills correctly on its own.
 */
function pieces(d) {
  const contours = d.split(/(?=M )/).map((c) => c.trim()).filter(Boolean).map((c) => {
    const nums = c.match(/-?\d+(\.\d+)?/g).map(Number);
    const pts = [];
    for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
    const xs = pts.map((q) => q[0]);
    const ys = pts.map((q) => q[1]);
    return { d: c, pts, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  });
  const inside = ([x, y], poly) => {
    let hit = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  };
  const contains = (a, b) =>
    a !== b && a.x0 <= b.x0 && a.x1 >= b.x1 && a.y0 <= b.y0 && a.y1 >= b.y1 && inside(b.pts[0], a.pts);
  for (const c of contours) c.parents = contours.filter((o) => contains(o, c));
  const result = [];
  for (const c of contours.filter((c) => c.parents.length % 2 === 0)) {
    const holes = contours.filter((h) => h.parents.length === c.parents.length + 1 && h.parents.includes(c));
    const r = (n) => +n.toFixed(1);
    result.push([[c.d, ...holes.map((h) => h.d)].join(" "), r((c.x0 + c.x1) / 2), r((c.y0 + c.y1) / 2), r(c.x1 - c.x0), r(c.y1 - c.y0)]);
  }
  // Largest first: the frame leads.
  return result.sort((a, b) => b[3] * b[4] - a[3] * a[4]);
}

const body = Object.entries(out)
  .map(([name, d]) => {
    const list = pieces(d);
    console.log(`${name}: ${list.length} pieces`);
    return `  ${name}: [\n${list.map((p) => `    ${JSON.stringify(p)},`).join("\n")}\n  ],`;
  })
  .join("\n");
writeFileSync(
  join(root, "src/emblem-paths.ts"),
  `// Generated by scripts/trace-emblems.mjs from assets/sigils.png. Do not edit by hand.
import type { ThemeName } from "./themes";

/** One piece of a sigil: its path (a shape and its own holes), center x/y, and width/height. */
export type EmblemPiece = readonly [d: string, x: number, y: number, w: number, h: number];

/** Each theme's sigil as separate pieces on a ${UNITS} x ${UNITS} grid, largest (the frame) first. */
export const EMBLEM_PIECES: Partial<Record<ThemeName, readonly EmblemPiece[]>> = {
${body}
};
`,
);
console.log("wrote src/emblem-paths.ts");
