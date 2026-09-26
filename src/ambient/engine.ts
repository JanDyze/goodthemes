import type { AmbientScene } from "../themes";

type RGB = readonly [number, number, number];

interface Env {
  w: number;
  h: number;
  /** --gt-ambient-1..3 from the active theme, resolved to RGB. */
  colors: readonly [RGB, RGB, RGB];
  /** --chart-1..5 in rainbow order (Great Flood charts are the bow in the cloud). */
  spectrum: readonly RGB[];
  density: number;
}

interface Scene {
  resize(): void;
  frame(ctx: CanvasRenderingContext2D, dt: number, t: number): void;
}

const TAU = Math.PI * 2;
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;

/** Particle count scaled to the viewport, so a phone and a 4K monitor feel equally busy. */
function budget(env: Env, areaPer: number, min: number, max: number) {
  return Math.round(Math.max(min, Math.min(max, (env.w * env.h) / areaPer)) * env.density);
}

function resizeList<T>(list: T[], size: number, make: () => T) {
  while (list.length < size) list.push(make());
  list.length = size;
}

/* ---- Exile, Noon: sand carried on a gusting wind ------------------------------ */

function sirocco(env: Env): Scene {
  interface Grain { x: number; y: number; speed: number; size: number; alpha: number; lift: number; phase: number; color: RGB }
  const grains: Grain[] = [];
  const make = (x?: number): Grain => ({
    x: x ?? rand(0, env.w),
    y: rand(0, env.h),
    speed: rand(0.55, 1.45),
    size: rand(0.5, 1.7),
    alpha: rand(0.2, 0.6),
    lift: rand(-0.12, 0.08),
    phase: rand(0, TAU),
    color: env.colors[Math.floor(Math.random() * 3)]!,
  });

  return {
    resize: () => resizeList(grains, budget(env, 6500, 60, 280), make),
    frame(ctx, dt, t) {
      // Gusts: a slow swell that comes in fits, then long stretches of calm.
      const swell = Math.max(0, Math.sin(t * 0.00027 + Math.sin(t * 0.00006) * 2.4));
      const gust = swell ** 4;
      const wind = 1.2 + 6.5 * gust;
      ctx.lineCap = "round";
      for (const g of grains) {
        g.x += wind * g.speed * dt;
        g.y += (g.lift * wind + Math.sin(t * 0.0021 + g.phase) * 0.3) * dt;
        if (g.x > env.w + 30) Object.assign(g, make(rand(-60, -10)));
        if (g.y < -10) g.y = env.h + 10;
        else if (g.y > env.h + 10) g.y = -10;

        const streak = 0.6 + wind * g.speed * 2.2;
        ctx.strokeStyle = rgba(g.color, g.alpha * (0.35 + 0.65 * gust));
        ctx.lineWidth = g.size;
        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        ctx.lineTo(g.x - streak, g.y - g.lift * streak);
        ctx.stroke();
      }
    },
  };
}

/* ---- Exile, Night: a slow-wheeling sky, and now and then a shooting star ------ */

function stars(env: Env): Scene {
  interface Star { x: number; y: number; r: number; base: number; rate: number; phase: number; color: RGB }
  interface Meteor { x: number; y: number; vx: number; vy: number; born: number; life: number }
  const sky: Star[] = [];
  let meteor: Meteor | null = null;
  let nextMeteor = performance.now() + rand(3000, 7000);

  const make = (): Star => {
    const roll = Math.random();
    return {
      x: rand(0, env.w),
      // Denser toward the top of the screen, the way a sky thins toward the horizon.
      y: env.h * Math.random() ** 1.6,
      r: Math.random() < 0.08 ? rand(1.1, 1.7) : rand(0.35, 1),
      base: rand(0.35, 0.9),
      rate: rand(0.4, 1.8),
      phase: rand(0, TAU),
      color: env.colors[roll < 0.7 ? 0 : roll < 0.85 ? 1 : 2]!,
    };
  };

  return {
    resize: () => resizeList(sky, budget(env, 4200, 90, 360), make),
    frame(ctx, dt, t) {
      for (const s of sky) {
        s.x += 0.01 * dt;
        if (s.x > env.w + 2) s.x = -2;
        const twinkle = 0.55 + 0.45 * Math.sin(t * 0.001 * s.rate + s.phase);
        ctx.fillStyle = rgba(s.color, s.base * twinkle);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TAU);
        ctx.fill();
      }

      if (!meteor && t > nextMeteor) {
        const leftward = Math.random() < 0.5;
        const angle = rand(0.35, 0.6);
        const speed = rand(13, 19);
        meteor = {
          x: rand(env.w * 0.15, env.w * 0.85),
          y: rand(0, env.h * 0.3),
          vx: Math.cos(angle) * speed * (leftward ? -1 : 1),
          vy: Math.sin(angle) * speed,
          born: t,
          life: rand(650, 1000),
        };
      }
      if (meteor) {
        const age = (t - meteor.born) / meteor.life;
        if (age >= 1) {
          meteor = null;
          nextMeteor = t + rand(7000, 18000);
        } else {
          meteor.x += meteor.vx * dt;
          meteor.y += meteor.vy * dt;
          const fade = Math.sin(age * Math.PI);
          const tailX = meteor.x - meteor.vx * 9;
          const tailY = meteor.y - meteor.vy * 9;
          const trail = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
          trail.addColorStop(0, rgba(env.colors[0], 0.9 * fade));
          trail.addColorStop(1, rgba(env.colors[1], 0));
          ctx.strokeStyle = trail;
          ctx.lineWidth = 1.4;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(meteor.x, meteor.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();
        }
      }
    },
  };
}

/* ---- First Garden, Morning: blossom petals and the odd leaf, tumbling down ------------ */

function petals(env: Env): Scene {
  interface Petal {
    x: number; y: number; size: number; fall: number; drift: number; rot: number; spin: number;
    flip: number; flipRate: number; sway: number; swayRate: number; phase: number; leaf: boolean; color: RGB; alpha: number;
  }
  const list: Petal[] = [];
  const make = (top = false): Petal => {
    const roll = Math.random();
    const leaf = roll > 0.84;
    return {
      x: rand(-20, env.w + 20),
      y: top ? rand(-60, -15) : rand(-20, env.h),
      size: leaf ? rand(7, 11) : rand(4.5, 9),
      fall: rand(0.3, 0.75),
      drift: rand(-0.1, 0.25),
      rot: rand(0, TAU),
      spin: rand(-0.02, 0.02),
      flip: rand(0, TAU),
      flipRate: rand(0.0015, 0.004),
      sway: rand(0.3, 1.1),
      swayRate: rand(0.0006, 0.0014),
      phase: rand(0, TAU),
      leaf,
      color: env.colors[leaf ? 2 : roll < 0.6 ? 0 : 1]!,
      alpha: leaf ? rand(0.45, 0.7) : rand(0.55, 0.9),
    };
  };

  return {
    resize: () => resizeList(list, budget(env, 36000, 10, 38), () => make()),
    frame(ctx, dt, t) {
      const breeze = 0.2 + 0.35 * Math.sin(t * 0.00013);
      for (const p of list) {
        p.x += (p.drift + breeze + Math.sin(t * p.swayRate + p.phase) * p.sway) * dt;
        p.y += p.fall * dt;
        p.rot += p.spin * dt;
        if (p.y > env.h + 24) Object.assign(p, make(true));
        if (p.x > env.w + 30) p.x = -30;
        else if (p.x < -30) p.x = env.w + 30;

        // Turning over in the air: squash along one axis, and dim the underside.
        const turn = Math.cos(t * p.flipRate + p.flip);
        const s = p.size;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(Math.max(0.14, Math.abs(turn)), 1);
        ctx.fillStyle = rgba(p.color, p.alpha * (turn < 0 ? 0.7 : 1));
        ctx.beginPath();
        if (p.leaf) {
          ctx.moveTo(0, -s);
          ctx.bezierCurveTo(s * 0.55, -s * 0.4, s * 0.55, s * 0.4, 0, s);
          ctx.bezierCurveTo(-s * 0.55, s * 0.4, -s * 0.55, -s * 0.4, 0, -s);
        } else {
          // A cherry-blossom petal: rounded base, notched tip.
          ctx.moveTo(0, s);
          ctx.bezierCurveTo(-s * 0.95, s * 0.3, -s * 0.8, -s * 0.9, -s * 0.2, -s * 0.95);
          ctx.lineTo(0, -s * 0.68);
          ctx.lineTo(s * 0.2, -s * 0.95);
          ctx.bezierCurveTo(s * 0.8, -s * 0.9, s * 0.95, s * 0.3, 0, s);
        }
        ctx.fill();
        ctx.restore();
      }
    },
  };
}

/* ---- First Garden, Evening: fireflies wandering the dark, blinking on and off --------- */

function fireflies(env: Env): Scene {
  interface Fly { x: number; y: number; heading: number; speed: number; period: number; phase: number; size: number; seed: number; color: RGB }
  const swarm: Fly[] = [];
  const make = (): Fly => ({
    x: rand(0, env.w),
    y: rand(env.h * 0.15, env.h),
    heading: rand(0, TAU),
    speed: rand(0.15, 0.45),
    period: rand(2400, 5600),
    phase: rand(0, TAU),
    size: rand(0.8, 1.5),
    seed: rand(0, 1000),
    color: env.colors[Math.random() < 0.75 ? 0 : 1]!,
  });

  return {
    resize: () => resizeList(swarm, budget(env, 40000, 8, 30), make),
    frame(ctx, dt, t) {
      ctx.globalCompositeOperation = "lighter";
      for (const f of swarm) {
        f.heading += (Math.sin(t * 0.0006 + f.seed) * 0.025 + rand(-0.035, 0.035)) * dt;
        f.x += Math.cos(f.heading) * f.speed * dt;
        f.y += (Math.sin(f.heading) * f.speed * 0.75 - 0.02) * dt;
        if (f.x < -20) f.x = env.w + 20;
        else if (f.x > env.w + 20) f.x = -20;
        if (f.y < -20) f.y = env.h + 20;
        else if (f.y > env.h + 20) f.y = -20;

        // Mostly dark, with a slow blink up to full glow.
        const blink = Math.max(0, Math.sin((t / f.period) * TAU + f.phase)) ** 3;
        const glow = 0.08 + 0.92 * blink;
        const radius = f.size * (7 + 9 * blink);
        const halo = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, radius);
        halo.addColorStop(0, rgba(f.color, 0.5 * glow));
        halo.addColorStop(0.3, rgba(f.color, 0.16 * glow));
        halo.addColorStop(1, rgba(f.color, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(f.x, f.y, radius, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(env.colors[2], 0.35 + 0.65 * glow);
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    },
  };
}

/* ---- Great Flood: rain, shared by both modes ---------------------------------------- */

interface Drop { x: number; y: number; len: number; speed: number; alpha: number }

function rainfall(env: Env, areaPer: number, max: number) {
  const drops: Drop[] = [];
  const make = (top = false): Drop => ({
    x: rand(-env.h * 0.3, env.w),
    y: top ? rand(-60, -10) : rand(-60, env.h),
    len: rand(10, 24),
    speed: rand(9, 15),
    alpha: rand(0.14, 0.38),
  });
  return {
    resize: () => resizeList(drops, budget(env, areaPer, 40, max), () => make()),
    /** Draws the first `share` of the drops; returns how many fell this frame. */
    frame(ctx: CanvasRenderingContext2D, dt: number, share: number, slant: number, color: RGB) {
      const active = Math.round(drops.length * share);
      let landed = 0;
      ctx.lineWidth = 1;
      ctx.lineCap = "round";
      for (let i = 0; i < active; i++) {
        const d = drops[i]!;
        d.y += d.speed * dt;
        d.x += d.speed * slant * dt;
        if (d.y > env.h + 20) {
          Object.assign(d, make(true));
          landed++;
        }
        ctx.strokeStyle = rgba(color, d.alpha);
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * slant, d.y - d.len);
        ctx.stroke();
      }
      return landed;
    },
  };
}

/* ---- Great Flood, Forty Days: squalls of rain, rings on the water, the bow between -- */

function downpour(env: Env): Scene {
  const rain = rainfall(env, 5200, 240);
  interface Ring { x: number; y: number; born: number; size: number }
  const rings: Ring[] = [];
  let bow = 0;

  return {
    resize: rain.resize,
    frame(ctx, dt, t) {
      // The rain comes in long squalls and eases off between them (about a minute a cycle).
      const squall = 0.5 + 0.5 * Math.sin(t * 0.00011 - Math.PI / 2);
      const share = 0.08 + 0.92 * squall;

      // When the rain nearly stops, the bow appears; it fades as the next squall builds.
      const target = squall < 0.22 ? 1 : 0;
      bow += (target - bow) * Math.min(1, 0.012 * dt);
      if (bow > 0.01 && env.spectrum.length) {
        const cx = env.w * 0.82;
        const cy = env.h * 1.02;
        const radius = Math.max(env.w, env.h) * 0.62;
        const band = Math.max(7, radius * 0.018);
        ctx.save();
        ctx.filter = `blur(${band * 0.6}px)`;
        env.spectrum.forEach((c, i) => {
          const r = radius - i * band;
          if (r <= band) return;
          ctx.strokeStyle = rgba(c, 0.2 * bow);
          ctx.lineWidth = band;
          ctx.beginPath();
          ctx.arc(cx, cy, r, Math.PI * 1.02, Math.PI * 1.98);
          ctx.stroke();
        });
        ctx.restore();
      }

      rain.frame(ctx, dt, share, 0.16, env.colors[0]);

      // Rings where drops strike the water: more of them the harder it rains.
      if (Math.random() < 0.9 * share * dt && rings.length < 40) {
        rings.push({ x: rand(0, env.w), y: rand(env.h * 0.25, env.h), born: t, size: rand(10, 22) });
      }
      ctx.lineWidth = 1;
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i]!;
        const age = (t - r.born) / 1100;
        if (age >= 1) {
          rings.splice(i, 1);
          continue;
        }
        const grow = 1 - (1 - age) ** 3;
        ctx.strokeStyle = rgba(env.colors[1], 0.32 * (1 - age));
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.size * grow, r.size * grow * 0.32, 0, 0, TAU);
        ctx.stroke();
      }
    },
  };
}

/* ---- Great Flood, The Deep: steady rain at night, lightning far off ---------------- */

function storm(env: Env): Scene {
  const rain = rainfall(env, 4400, 280);
  let strike = { at: performance.now() + rand(4000, 9000), x: 0.5 };

  return {
    resize: rain.resize,
    frame(ctx, dt, t) {
      // Distant lightning: a soft double pulse lighting the sky from above, never a hard flash.
      const since = t - strike.at;
      if (since > 0) {
        const glow = since < 140 ? since / 140 : since < 260 ? 1 - (since - 140) / 120 * 0.8 : since < 380 ? 0.2 + (since - 260) / 120 * 0.5 : 0.7 * Math.exp(-(since - 380) / 260);
        if (since > 1600) strike = { at: t + rand(9000, 24000), x: rand(0.15, 0.85) };
        const sky = ctx.createRadialGradient(env.w * strike.x, -env.h * 0.1, 0, env.w * strike.x, -env.h * 0.1, env.h * 1.1);
        sky.addColorStop(0, rgba(env.colors[2], 0.13 * glow));
        sky.addColorStop(1, rgba(env.colors[2], 0));
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, env.w, env.h);
      }
      const gusting = 0.75 + 0.25 * Math.sin(t * 0.00023);
      rain.frame(ctx, dt, gusting, 0.24, env.colors[0]);
    },
  };
}

/* ---- Unfinished Tower, The Plain: letters of every script, scattering outward ------------ */

// Glyphs from scripts with wide system-font coverage, so none render as empty boxes.
const GLYPHS = [
  "A", "R", "\u03A9", "\u03BB", "\u0394", "\u05D0", "\u05E9", "\u05D1", "\u0639", "\u0643", "\u062C",
  "\u0905", "\u0915", "\u0416", "\u042F", "\u0424", "\u8A00", "\u8A9E", "\u6587", "\u1200", "\u1208",
  "\u0531", "\u0554", "\u10D0", "\u10E6", "\u13A0", "\u0E01", "\u16A0", "\u16B1", "\u16DF", "\u03C8",
];

function tongues(env: Env): Scene {
  interface Glyph { x: number; y: number; vx: number; vy: number; spin: number; rot: number; size: number; born: number; life: number; char: string; color: RGB; alpha: number }
  const glyphs: Glyph[] = [];
  const make = (t: number, fresh = true): Glyph => {
    // They set out from around the tower, near the middle of the screen, and drift apart.
    const angle = rand(0, TAU);
    const speed = rand(0.12, 0.38);
    const life = rand(14000, 24000);
    return {
      x: env.w * 0.5 + rand(-env.w * 0.12, env.w * 0.12),
      y: env.h * 0.45 + rand(-env.h * 0.12, env.h * 0.12),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      spin: rand(-0.004, 0.004),
      rot: rand(-0.3, 0.3),
      size: [16, 22, 30][Math.floor(Math.random() * 3)]!,
      born: fresh ? t : t - rand(0, life),
      life,
      char: GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!,
      color: env.colors[Math.floor(Math.random() * 3)]!,
      alpha: rand(0.1, 0.22),
    };
  };

  return {
    resize: () => resizeList(glyphs, budget(env, 34000, 12, 44), () => make(performance.now(), false)),
    frame(ctx, _dt, t) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = 0; i < glyphs.length; i++) if (t - glyphs[i]!.born >= glyphs[i]!.life) glyphs[i] = make(t);
      // Sorted by size so the canvas font changes at most three times a frame.
      let font = 0;
      for (const g of [...glyphs].sort((a, b) => a.size - b.size)) {
        if (g.size !== font) {
          font = g.size;
          ctx.font = `${font}px ui-serif, "Noto Serif", "Segoe UI Symbol", serif`;
        }
        const age = (t - g.born) / g.life;
        // Position is a function of age, so glyphs seeded mid-journey start where they belong.
        const elapsed = (t - g.born) / (1000 / 60);
        const fade = Math.min(1, age * 6) * Math.min(1, (1 - age) * 3);
        ctx.save();
        ctx.translate(g.x + g.vx * elapsed, g.y + g.vy * elapsed);
        ctx.rotate(g.rot + g.spin * elapsed);
        ctx.fillStyle = rgba(g.color, g.alpha * fade);
        ctx.fillText(g.char, 0, 0);
        ctx.restore();
      }
    },
  };
}

/* ---- Unfinished Tower, Torchlight: the terraces lit one above another ------------------- */

function torches(env: Env): Scene {
  interface Torch { x: number; y: number; phase: number; rate: number; size: number }
  interface Ember { x: number; y: number; vx: number; vy: number; born: number; life: number }
  let lights: Torch[] = [];
  const embers: Ember[] = [];

  // Seven terraces, each narrower than the one below: the tower drawn only in its lights.
  const build = () => {
    lights = [];
    const base = env.h * 0.94;
    const step = Math.min(env.h * 0.075, 64);
    const widest = Math.min(env.w * 0.82, 1100);
    for (let level = 0; level < 7; level++) {
      const width = widest * (1 - level * 0.12);
      const count = Math.max(2, Math.round((width / 150) * env.density));
      for (let i = 0; i < count; i++) {
        lights.push({
          x: env.w / 2 - width / 2 + (width * (i + 0.5)) / count + rand(-8, 8),
          y: base - level * step,
          phase: rand(0, TAU),
          rate: rand(0.006, 0.011),
          size: rand(0.8, 1.2) * (1 - level * 0.06),
        });
      }
    }
  };

  return {
    resize: build,
    frame(ctx, dt, t) {
      ctx.globalCompositeOperation = "lighter";
      for (const torch of lights) {
        // Flicker: two out-of-step waves plus a little noise, never fully dark.
        const flicker = 0.72 + 0.14 * Math.sin(t * torch.rate + torch.phase) + 0.08 * Math.sin(t * torch.rate * 2.7) + rand(-0.05, 0.05);
        const radius = 34 * torch.size * flicker;
        const glow = ctx.createRadialGradient(torch.x, torch.y, 0, torch.x, torch.y, radius);
        glow.addColorStop(0, rgba(env.colors[2], 0.42 * flicker));
        glow.addColorStop(0.18, rgba(env.colors[0], 0.22 * flicker));
        glow.addColorStop(1, rgba(env.colors[1], 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(torch.x, torch.y, radius, 0, TAU);
        ctx.fill();
        if (Math.random() < 0.006 * dt && embers.length < 60) {
          embers.push({ x: torch.x, y: torch.y - 4, vx: rand(-0.15, 0.15), vy: rand(-0.9, -0.45), born: t, life: rand(1400, 2600) });
        }
      }
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i]!;
        const age = (t - e.born) / e.life;
        if (age >= 1) {
          embers.splice(i, 1);
          continue;
        }
        e.x += (e.vx + Math.sin(t * 0.003 + i) * 0.12) * dt;
        e.y += e.vy * dt;
        ctx.fillStyle = rgba(env.colors[0], 0.7 * (1 - age));
        ctx.beginPath();
        ctx.arc(e.x, e.y, 1.1, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    },
  };
}

/* ---- Good Wine, The Feast: water drawn out and turned to wine as it falls --------- */

function wine(env: Env): Scene {
  interface Drop { x: number; y: number; speed: number; size: number; sway: number; phase: number; turn: number }
  interface Fleck { x: number; y: number; rise: number; size: number; phase: number }
  const drops: Drop[] = [];
  const flecks: Fleck[] = [];
  const makeDrop = (top = false): Drop => ({
    x: rand(0, env.w),
    y: top ? rand(-40, -10) : rand(-40, env.h),
    speed: rand(0.5, 1.2),
    size: rand(3, 6),
    sway: rand(0.1, 0.4),
    phase: rand(0, TAU),
    // Where on the way down this drop becomes wine (as a share of the screen height).
    turn: rand(0.3, 0.6),
  });
  const makeFleck = (bottom = false): Fleck => ({
    x: rand(0, env.w),
    y: bottom ? env.h + rand(5, 30) : rand(0, env.h),
    rise: rand(0.15, 0.4),
    size: rand(0.6, 1.5),
    phase: rand(0, TAU),
  });
  const mix = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k].map(Math.round) as unknown as RGB;

  return {
    resize() {
      resizeList(drops, budget(env, 30000, 10, 34), () => makeDrop());
      resizeList(flecks, budget(env, 26000, 12, 40), () => makeFleck());
    },
    frame(ctx, dt, t) {
      for (const d of drops) {
        d.y += d.speed * dt;
        d.x += Math.sin(t * 0.001 + d.phase) * d.sway * dt;
        if (d.y > env.h + 20) Object.assign(d, makeDrop(true));
        const k = Math.min(1, Math.max(0, (d.y / env.h - d.turn) / 0.18));
        const color = mix(env.colors[2], env.colors[0], k * k * (3 - 2 * k));
        const s = d.size;
        ctx.fillStyle = rgba(color, 0.3 + 0.25 * k);
        ctx.beginPath();
        ctx.moveTo(d.x, d.y - s * 1.6);
        ctx.bezierCurveTo(d.x + s * 0.2, d.y - s * 0.9, d.x + s, d.y - s * 0.2, d.x + s, d.y + s * 0.2);
        ctx.arc(d.x, d.y + s * 0.2, s, 0, Math.PI);
        ctx.bezierCurveTo(d.x - s, d.y - s * 0.2, d.x - s * 0.2, d.y - s * 0.9, d.x, d.y - s * 1.6);
        ctx.fill();
      }
      for (const f of flecks) {
        f.y -= f.rise * dt;
        f.x += Math.sin(t * 0.0008 + f.phase) * 0.15 * dt;
        if (f.y < -10) Object.assign(f, makeFleck(true));
        const glint = 0.35 + 0.65 * Math.max(0, Math.sin(t * 0.002 + f.phase)) ** 2;
        ctx.fillStyle = rgba(env.colors[1], 0.55 * glint);
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, TAU);
        ctx.fill();
      }
    },
  };
}

/* ---- Good Wine, The Good Wine: strings of lamps swaying over the feast ------------ */

function lamps(env: Env): Scene {
  interface Garland { y: number; sag: number; phase: number; count: number }
  let garlands: Garland[] = [];

  const build = () => {
    const spacing = env.w < 640 ? 46 : 64;
    const count = Math.max(6, Math.round((env.w * 1.1) / spacing));
    garlands = [
      { y: env.h * 0.06, sag: Math.min(env.h * 0.1, 90), phase: 0, count },
      { y: env.h * 0.14, sag: Math.min(env.h * 0.13, 120), phase: 1.9, count: count + 3 },
      { y: env.h * 0.02, sag: Math.min(env.h * 0.07, 60), phase: 3.7, count: count - 2 },
    ];
  };

  return {
    resize: build,
    frame(ctx, _dt, t) {
      for (const g of garlands) {
        const sway = Math.sin(t * 0.0005 + g.phase);
        const sag = g.sag * (1 + 0.06 * sway);
        const x0 = -env.w * 0.05;
        const x1 = env.w * 1.05;
        // A hanging string is close enough to a parabola at these proportions.
        const at = (u: number) => [x0 + (x1 - x0) * u + sway * 4 * Math.sin(u * Math.PI), g.y + sag * 4 * u * (1 - u)] as const;

        ctx.strokeStyle = rgba(env.colors[2], 0.35);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) {
          const [x, y] = at(i / 40);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.globalCompositeOperation = "lighter";
        for (let i = 1; i < g.count; i++) {
          const [x, y0] = at(i / g.count);
          const y = y0 + 5;
          const flicker = 0.78 + 0.12 * Math.sin(t * 0.004 + i * 1.7 + g.phase) + rand(-0.04, 0.04);
          const radius = 18 * flicker;
          const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
          glow.addColorStop(0, rgba(env.colors[0], 0.5 * flicker));
          glow.addColorStop(0.25, rgba(env.colors[1], 0.2 * flicker));
          glow.addColorStop(1, rgba(env.colors[1], 0));
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, TAU);
          ctx.fill();
          ctx.fillStyle = rgba(env.colors[0], 0.85);
          ctx.beginPath();
          ctx.arc(x, y, 1.6, 0, TAU);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      }
    },
  };
}

/* ---- Shared: a warm point of light (torches, lanterns, campfires) --------------- */

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, core: RGB, halo: RGB, strength: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, rgba(core, 0.5 * strength));
  g.addColorStop(0.22, rgba(halo, 0.22 * strength));
  g.addColorStop(1, rgba(halo, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
}

/* ---- Fallen Walls, Seventh Day: the horns sound, and the seventh time the wall falls --- */

function shofar(env: Env): Scene {
  interface Mote { x: number; y: number; vx: number; vy: number; size: number }
  interface Blast { born: number; strong: boolean }
  const motes: Mote[] = [];
  const blasts: Blast[] = [];
  let count = 0;
  let next = performance.now() + 1500;
  const make = (): Mote => ({ x: rand(0, env.w), y: rand(0, env.h), vx: rand(-0.08, 0.08), vy: rand(-0.12, -0.02), size: rand(0.6, 1.6) });

  return {
    resize: () => resizeList(motes, budget(env, 14000, 30, 120), make),
    frame(ctx, dt, t) {
      if (t > next) {
        count = (count % 7) + 1;
        blasts.push({ born: t, strong: count === 7 });
        next = t + (count === 7 ? 9000 : 4200);
        // The seventh blast shakes the dust loose.
        if (count === 7) for (const m of motes) m.vy -= rand(0.2, 0.6);
      }
      const reach = Math.hypot(env.w / 2, env.h) * 1.05;
      for (let i = blasts.length - 1; i >= 0; i--) {
        const b = blasts[i]!;
        const age = (t - b.born) / (b.strong ? 3400 : 2600);
        if (age >= 1) {
          blasts.splice(i, 1);
          continue;
        }
        const ease = 1 - (1 - age) ** 2;
        for (let k = 0; k < (b.strong ? 3 : 1); k++) {
          const r = reach * ease - k * 26;
          if (r <= 0) continue;
          ctx.strokeStyle = rgba(env.colors[1], (b.strong ? 0.3 : 0.18) * (1 - age));
          ctx.lineWidth = b.strong ? 2.2 : 1.4;
          ctx.beginPath();
          ctx.arc(env.w / 2, env.h + 20, r, Math.PI, TAU);
          ctx.stroke();
        }
      }
      for (const m of motes) {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.vy += (-0.05 - m.vy) * 0.01 * dt;
        if (m.y < -10) Object.assign(m, make(), { y: env.h + 5 });
        ctx.fillStyle = rgba(env.colors[0], 0.35);
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size, 0, TAU);
        ctx.fill();
      }
    },
  };
}

/* ---- Fallen Walls, Scarlet Cord: the camp's fires ringing the city at night -------- */

function camp(env: Env): Scene {
  interface Fire { x: number; y: number; phase: number; size: number }
  interface Ember { x: number; y: number; vx: number; vy: number; born: number; life: number }
  let fires: Fire[] = [];
  const embers: Ember[] = [];
  const build = () => {
    const n = Math.max(5, Math.round((env.w / 170) * env.density));
    fires = Array.from({ length: n }, (_, i) => ({
      x: ((i + 0.5) / n) * env.w + rand(-30, 30),
      y: env.h * rand(0.86, 0.96),
      phase: rand(0, TAU),
      size: rand(0.8, 1.25),
    }));
  };
  return {
    resize: build,
    frame(ctx, dt, t) {
      ctx.globalCompositeOperation = "lighter";
      for (const f of fires) {
        const flicker = 0.7 + 0.15 * Math.sin(t * 0.009 + f.phase) + 0.1 * Math.sin(t * 0.023 + f.phase * 2) + rand(-0.05, 0.05);
        glow(ctx, f.x, f.y, 44 * f.size * flicker, env.colors[2], env.colors[0], flicker);
        if (Math.random() < 0.02 * dt && embers.length < 80) {
          embers.push({ x: f.x + rand(-4, 4), y: f.y - 6, vx: rand(-0.2, 0.2), vy: rand(-1.1, -0.5), born: t, life: rand(1200, 2600) });
        }
      }
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i]!;
        const age = (t - e.born) / e.life;
        if (age >= 1) {
          embers.splice(i, 1);
          continue;
        }
        e.x += (e.vx + Math.sin(t * 0.004 + i) * 0.15) * dt;
        e.y += e.vy * dt;
        ctx.fillStyle = rgba(env.colors[1], 0.8 * (1 - age));
        ctx.beginPath();
        ctx.arc(e.x, e.y, 1.1, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    },
  };
}

/* ---- Furnace: tongues of flame along the floor, sparks going up ---------------- */

function fire(env: Env, heat: number): Scene {
  interface Tongue { x: number; width: number; height: number; phase: number; rate: number }
  interface Spark { x: number; y: number; vx: number; vy: number; born: number; life: number; size: number }
  let tongues: Tongue[] = [];
  const sparks: Spark[] = [];
  const build = () => {
    const n = Math.max(8, Math.round(env.w / 46));
    tongues = Array.from({ length: n }, (_, i) => ({
      x: ((i + rand(0.2, 0.8)) / n) * env.w,
      width: rand(26, 54),
      height: rand(60, 150) * heat,
      phase: rand(0, TAU),
      rate: rand(0.004, 0.009),
    }));
  };
  return {
    resize: build,
    frame(ctx, dt, t) {
      ctx.globalCompositeOperation = heat > 1 ? "lighter" : "source-over";
      for (const f of tongues) {
        const lick = 0.7 + 0.3 * Math.sin(t * f.rate + f.phase) * Math.sin(t * f.rate * 0.37 + f.phase * 1.7);
        const h = f.height * lick;
        const sway = Math.sin(t * f.rate * 0.8 + f.phase) * f.width * 0.35;
        const base = env.h + 6;
        const grad = ctx.createLinearGradient(0, base, 0, base - h);
        grad.addColorStop(0, rgba(env.colors[2], 0.42 * heat));
        grad.addColorStop(0.45, rgba(env.colors[0], 0.3 * heat));
        grad.addColorStop(1, rgba(env.colors[1], 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(f.x - f.width / 2, base);
        ctx.bezierCurveTo(f.x - f.width * 0.5, base - h * 0.45, f.x + sway * 0.4 - f.width * 0.15, base - h * 0.7, f.x + sway, base - h);
        ctx.bezierCurveTo(f.x + sway * 0.4 + f.width * 0.2, base - h * 0.65, f.x + f.width * 0.5, base - h * 0.4, f.x + f.width / 2, base);
        ctx.closePath();
        ctx.fill();
        if (Math.random() < 0.012 * heat * dt && sparks.length < 90) {
          sparks.push({ x: f.x + sway, y: base - h * 0.6, vx: rand(-0.4, 0.4), vy: rand(-2, -0.9), born: t, life: rand(900, 2200), size: rand(0.7, 1.6) });
        }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]!;
        const age = (t - s.born) / s.life;
        if (age >= 1) {
          sparks.splice(i, 1);
          continue;
        }
        s.x += (s.vx + Math.sin(t * 0.005 + i) * 0.25) * dt;
        s.y += s.vy * dt;
        s.vy *= 0.995;
        ctx.fillStyle = rgba(env.colors[1], 0.9 * (1 - age));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    },
  };
}

const blaze = (env: Env) => fire(env, 1);
const inferno = (env: Env) => fire(env, 1.35);

/* ---- Fishers of Men, Daybreak: sun glinting on the lake ------------------------------ */

function glints(env: Env): Scene {
  interface Glint { x: number; y: number; len: number; phase: number; rate: number }
  const list: Glint[] = [];
  const make = (): Glint => {
    // More of them lower down, where the water is closer.
    const depth = Math.random() ** 0.7;
    return { x: rand(0, env.w), y: env.h * (0.35 + 0.65 * depth), len: 4 + 14 * depth, phase: rand(0, TAU), rate: rand(0.0015, 0.004) };
  };
  return {
    resize: () => resizeList(list, budget(env, 5500, 50, 240), make),
    frame(ctx, dt, t) {
      ctx.lineCap = "round";
      for (const g of list) {
        g.x += 0.06 * dt;
        if (g.x > env.w + 20) g.x = -20;
        const on = Math.max(0, Math.sin(t * g.rate + g.phase)) ** 6;
        if (on < 0.02) continue;
        ctx.strokeStyle = rgba(on > 0.6 ? env.colors[0] : env.colors[1], 0.75 * on);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(g.x - g.len / 2, g.y);
        ctx.lineTo(g.x + g.len / 2, g.y);
        ctx.stroke();
      }
    },
  };
}

/* ---- Fishers of Men, Night Watch: boat lanterns bobbing, their light on the water ------ */

function lanterns(env: Env): Scene {
  interface Boat { x: number; y: number; phase: number; drift: number; size: number }
  let boats: Boat[] = [];
  const build = () => {
    const n = Math.max(3, Math.min(7, Math.round(env.w / 260)));
    boats = Array.from({ length: n }, (_, i) => ({
      x: ((i + rand(0.2, 0.8)) / n) * env.w,
      y: env.h * rand(0.5, 0.82),
      phase: rand(0, TAU),
      drift: rand(-0.04, 0.04),
      size: rand(0.75, 1.2),
    }));
  };
  return {
    resize: build,
    frame(ctx, dt, t) {
      ctx.globalCompositeOperation = "lighter";
      for (const b of boats) {
        b.x += b.drift * dt;
        if (b.x < -40) b.x = env.w + 40;
        else if (b.x > env.w + 40) b.x = -40;
        const bob = Math.sin(t * 0.0012 + b.phase) * 3;
        const flicker = 0.8 + 0.1 * Math.sin(t * 0.011 + b.phase) + rand(-0.04, 0.04);
        glow(ctx, b.x, b.y + bob, 30 * b.size * flicker, env.colors[0], env.colors[1], flicker);
        // Its reflection: broken bands of light wavering beneath it.
        for (let k = 1; k <= 9; k++) {
          const y = b.y + 14 + k * 7;
          const w = (12 - k) * b.size * (0.7 + 0.3 * Math.sin(t * 0.004 + k + b.phase));
          const x = b.x + Math.sin(t * 0.003 + k * 0.9 + b.phase) * 4;
          ctx.fillStyle = rgba(env.colors[1], 0.22 * (1 - k / 10) * flicker);
          ctx.fillRect(x - w / 2, y, w, 1.6);
        }
      }
      ctx.globalCompositeOperation = "source-over";
    },
  };
}

/* ---- Mighty Wind, Rushing Wind: long streamlines sweeping through --------------- */

function wind(env: Env): Scene {
  interface Stream { x: number; y: number; speed: number; len: number; amp: number; freq: number; phase: number; alpha: number }
  const streams: Stream[] = [];
  const make = (anywhere = false): Stream => ({
    x: anywhere ? rand(-400, env.w) : rand(-600, -200),
    y: rand(0, env.h),
    speed: rand(6, 13),
    len: rand(160, 420),
    amp: rand(8, 30),
    freq: rand(0.004, 0.009),
    phase: rand(0, TAU),
    alpha: rand(0.12, 0.3),
  });
  return {
    resize: () => resizeList(streams, budget(env, 60000, 6, 22), () => make(true)),
    frame(ctx, dt, t) {
      const gust = 0.6 + 0.4 * Math.max(0, Math.sin(t * 0.00035)) ** 2;
      ctx.lineCap = "round";
      ctx.lineWidth = 1.2;
      for (const s of streams) {
        s.x += s.speed * gust * dt;
        if (s.x - s.len > env.w + 20) Object.assign(s, make());
        const steps = 24;
        for (let i = 0; i < steps; i++) {
          const x0 = s.x - (s.len * i) / steps;
          const x1 = s.x - (s.len * (i + 1)) / steps;
          const y = (x: number) => s.y + s.amp * Math.sin(x * s.freq + s.phase + t * 0.0006);
          // Brightest just behind the head, fading toward the tail.
          ctx.strokeStyle = rgba(i < 3 ? env.colors[1] : env.colors[0], s.alpha * gust * (1 - i / steps));
          ctx.beginPath();
          ctx.moveTo(x0, y(x0));
          ctx.lineTo(x1, y(x1));
          ctx.stroke();
        }
      }
    },
  };
}

/* ---- Mighty Wind, Tongues of Fire: cloven flames resting, flickering, going out -- */

function tonguesOfFire(env: Env): Scene {
  interface Flame { x: number; y: number; born: number; life: number; size: number; phase: number }
  const flames: Flame[] = [];
  const make = (t: number, seeded = false): Flame => {
    const life = rand(5000, 11000);
    return { x: rand(env.w * 0.05, env.w * 0.95), y: rand(env.h * 0.1, env.h * 0.9), born: seeded ? t - rand(0, life) : t, life, size: rand(7, 13), phase: rand(0, TAU) };
  };
  const tongue = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, lean: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x - s * 0.7, y - s * 0.5, x - s * 0.3 + lean * s, y - s * 1.3, x + lean * s * 1.4, y - s * 2);
    ctx.bezierCurveTo(x + s * 0.3 + lean * s, y - s * 1.3, x + s * 0.7, y - s * 0.5, x, y);
    ctx.fill();
  };
  return {
    resize: () => resizeList(flames, budget(env, 70000, 6, 18), () => make(performance.now(), true)),
    frame(ctx, _dt, t) {
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < flames.length; i++) {
        let f = flames[i]!;
        if (t - f.born >= f.life) f = flames[i] = make(t);
        const age = (t - f.born) / f.life;
        const fade = Math.min(1, age * 5) * Math.min(1, (1 - age) * 4);
        const flick = 0.85 + 0.15 * Math.sin(t * 0.012 + f.phase) + rand(-0.04, 0.04);
        const s = f.size * flick;
        glow(ctx, f.x, f.y - s, s * 4, env.colors[0], env.colors[1], 0.6 * fade);
        ctx.fillStyle = rgba(env.colors[1], 0.55 * fade);
        tongue(ctx, f.x - s * 0.18, f.y, s, -0.28);
        tongue(ctx, f.x + s * 0.18, f.y, s * 0.9, 0.28);
        ctx.fillStyle = rgba(env.colors[0], 0.5 * fade);
        tongue(ctx, f.x, f.y, s * 0.5, 0);
      }
      ctx.globalCompositeOperation = "source-over";
    },
  };
}

/* ---- Pearl Gates: light glinting through gold and stone (and, by night, radiance) ----- */

function prism(env: Env, rays: boolean): Scene {
  interface Spark { x: number; y: number; born: number; life: number; size: number; color: RGB; turn: number }
  const sparks: Spark[] = [];
  const make = (t: number, seeded = false): Spark => {
    const life = rand(2200, 5200);
    return { x: rand(0, env.w), y: rand(0, env.h), born: seeded ? t - rand(0, life) : t, life, size: rand(3, 9), color: env.colors[Math.floor(Math.random() * 3)]!, turn: rand(0, Math.PI / 4) };
  };
  const star = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, turn: number) => {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = turn + (i * Math.PI) / 4;
      const r = i % 2 ? s * 0.22 : s;
      if (i === 0) ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a));
      else ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
    }
    ctx.closePath();
    ctx.fill();
  };
  return {
    resize: () => resizeList(sparks, budget(env, 26000, 16, 60), () => make(performance.now(), true)),
    frame(ctx, _dt, t) {
      if (rays) {
        // Slow beams from above: the city lit with no sun.
        ctx.globalCompositeOperation = "lighter";
        const cx = env.w / 2;
        const len = Math.hypot(env.w, env.h);
        for (let i = 0; i < 9; i++) {
          const a = Math.PI / 2 + Math.sin(t * 0.00008 + i * 1.3) * 0.9 + (i - 4) * 0.16;
          const spread = 0.05 + 0.02 * Math.sin(t * 0.0003 + i);
          const g = ctx.createLinearGradient(cx, -40, cx + Math.cos(a) * len, Math.sin(a) * len);
          g.addColorStop(0, rgba(env.colors[0], 0.1));
          g.addColorStop(1, rgba(env.colors[0], 0));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(cx, -40);
          ctx.lineTo(cx + Math.cos(a - spread) * len, Math.sin(a - spread) * len);
          ctx.lineTo(cx + Math.cos(a + spread) * len, Math.sin(a + spread) * len);
          ctx.closePath();
          ctx.fill();
        }
      }
      for (let i = 0; i < sparks.length; i++) {
        let s = sparks[i]!;
        if (t - s.born >= s.life) s = sparks[i] = make(t);
        const age = (t - s.born) / s.life;
        const bloom = Math.sin(age * Math.PI) ** 2;
        ctx.fillStyle = rgba(s.color, (rays ? 0.7 : 0.55) * bloom);
        star(ctx, s.x, s.y, s.size * (0.4 + 0.6 * bloom), s.turn + age * 0.6);
      }
      ctx.globalCompositeOperation = "source-over";
    },
  };
}

/* ---- Shepherd, Green Pastures: wool clouds drifting over the hills ------------- */

function pasture(env: Env): Scene {
  interface Puff { dx: number; dy: number; r: number }
  interface Cloud { x: number; y: number; speed: number; scale: number; puffs: Puff[]; alpha: number }
  const clouds: Cloud[] = [];
  const make = (anywhere = true): Cloud => {
    const n = 5 + Math.floor(Math.random() * 3);
    // Puffs in a row, fullest in the middle, so each cloud has a rounded crown.
    const puffs = Array.from({ length: n }, (_, i) => ({
      dx: (i - n / 2) * rand(14, 20),
      dy: rand(-10, 6) - Math.sin((i / (n - 1)) * Math.PI) * 10,
      r: rand(16, 28) * (0.75 + 0.5 * Math.sin((i / (n - 1)) * Math.PI)),
    }));
    return { x: anywhere ? rand(-100, env.w) : -180, y: rand(env.h * 0.04, env.h * 0.4), speed: rand(0.08, 0.2), scale: rand(0.7, 1.4), puffs, alpha: rand(0.5, 0.8) };
  };
  return {
    resize: () => resizeList(clouds, budget(env, 180000, 3, 8), () => make()),
    frame(ctx, dt) {
      for (const c of clouds) {
        c.x += c.speed * dt;
        if (c.x - 160 * c.scale > env.w) Object.assign(c, make(false));
        for (const p of c.puffs) {
          const x = c.x + p.dx * c.scale;
          const y = c.y + p.dy * c.scale;
          const r = p.r * c.scale;
          const g = ctx.createRadialGradient(x, y - r * 0.2, 0, x, y, r);
          g.addColorStop(0, rgba(env.colors[0], c.alpha));
          g.addColorStop(0.7, rgba(env.colors[1], c.alpha * 0.85));
          g.addColorStop(1, rgba(env.colors[2], 0));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.fill();
        }
      }
    },
  };
}

/* ---- Shepherd, The Fold: a watch-fire on the hill, a few stars ----------------- */

function fold(env: Env): Scene {
  interface Star { x: number; y: number; r: number; phase: number; rate: number }
  interface Ember { x: number; y: number; vx: number; vy: number; born: number; life: number }
  const sky: Star[] = [];
  const embers: Ember[] = [];
  const fire = () => ({ x: Math.max(70, env.w * 0.12), y: env.h * 0.9 });
  return {
    resize: () => resizeList(sky, budget(env, 16000, 20, 90), () => ({ x: rand(0, env.w), y: env.h * Math.random() ** 1.8 * 0.7, r: rand(0.4, 1.2), phase: rand(0, TAU), rate: rand(0.5, 1.5) })),
    frame(ctx, dt, t) {
      for (const s of sky) {
        ctx.fillStyle = rgba(env.colors[2], 0.35 + 0.35 * Math.sin(t * 0.001 * s.rate + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TAU);
        ctx.fill();
      }
      const f = fire();
      ctx.globalCompositeOperation = "lighter";
      const flicker = 0.75 + 0.12 * Math.sin(t * 0.011) + 0.08 * Math.sin(t * 0.027) + rand(-0.04, 0.04);
      glow(ctx, f.x, f.y, 90 * flicker, env.colors[0], env.colors[1], flicker);
      if (Math.random() < 0.08 * dt && embers.length < 60) {
        embers.push({ x: f.x + rand(-8, 8), y: f.y - 6, vx: rand(-0.25, 0.35), vy: rand(-1.3, -0.6), born: t, life: rand(1400, 2800) });
      }
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i]!;
        const age = (t - e.born) / e.life;
        if (age >= 1) {
          embers.splice(i, 1);
          continue;
        }
        e.x += (e.vx + Math.sin(t * 0.004 + i) * 0.2) * dt;
        e.y += e.vy * dt;
        ctx.fillStyle = rgba(env.colors[0], 0.85 * (1 - age));
        ctx.beginPath();
        ctx.arc(e.x, e.y, 1.2, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    },
  };
}

/* ---- Ekklesia, Breaking Bread: tesserae being laid, a few at a time ---------- */

function tesserae(env: Env): Scene {
  const CELL = 14;
  interface Tile { col: number; row: number; born: number; life: number; color: RGB }
  const tiles: Tile[] = [];
  const make = (t: number, seeded = false): Tile => {
    const life = rand(2600, 5200);
    return {
      col: Math.floor(rand(0, env.w / CELL)),
      row: Math.floor(rand(0, env.h / CELL)),
      born: seeded ? t - rand(0, life) : t,
      life,
      color: env.colors[Math.floor(Math.random() * 3)]!,
    };
  };
  return {
    resize: () => resizeList(tiles, budget(env, 9000, 30, 140), () => make(performance.now(), true)),
    frame(ctx, _dt, t) {
      for (let i = 0; i < tiles.length; i++) {
        let tile = tiles[i]!;
        if (t - tile.born >= tile.life) tile = tiles[i] = make(t);
        const age = (t - tile.born) / tile.life;
        // Set quickly, rest a while, fade out slowly.
        const a = Math.min(1, age * 8) * Math.min(1, (1 - age) * 2.5);
        ctx.fillStyle = rgba(tile.color, 0.2 * a);
        ctx.fillRect(tile.col * CELL + 1, tile.row * CELL + 1, CELL - 2, CELL - 2);
      }
    },
  };
}

/* ---- Ekklesia, Many Lights: lamps at every depth of the upper room ------------- */

function manyLights(env: Env): Scene {
  interface Lamp { x: number; y: number; depth: number; drift: number; phase: number; rate: number; color: RGB }
  const lamps: Lamp[] = [];
  const make = (): Lamp => ({
    x: rand(0, env.w),
    y: rand(0, env.h),
    depth: Math.random(),
    drift: rand(-0.05, 0.05),
    phase: rand(0, TAU),
    rate: rand(0.0015, 0.004),
    color: env.colors[Math.floor(Math.random() * 3)]!,
  });
  return {
    resize: () => resizeList(lamps, budget(env, 38000, 10, 34), make),
    frame(ctx, dt, t) {
      ctx.globalCompositeOperation = "lighter";
      for (const l of lamps) {
        l.x += l.drift * dt * (0.4 + l.depth);
        l.y -= 0.02 * dt * (0.4 + l.depth);
        if (l.y < -40) l.y = env.h + 40;
        if (l.x < -40) l.x = env.w + 40;
        else if (l.x > env.w + 40) l.x = -40;
        // Near lamps are large and soft; far ones small and sharp.
        const r = 5 + l.depth * 26;
        const pulse = 0.8 + 0.2 * Math.sin(t * l.rate + l.phase);
        const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
        const a = (0.1 + 0.18 * (1 - l.depth)) * pulse;
        g.addColorStop(0, rgba(l.color, a * 1.6));
        g.addColorStop(0.35 + l.depth * 0.35, rgba(l.color, a));
        g.addColorStop(1, rgba(l.color, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(l.x, l.y, r, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    },
  };
}

/* ---- Swallowed, Dry Land: surf lapping along the bottom of the page ------------ */

function surf(env: Env): Scene {
  interface Bubble { x: number; y: number; r: number; rise: number; phase: number }
  const bubbles: Bubble[] = [];
  const make = (bottom = false): Bubble => ({ x: rand(0, env.w), y: bottom ? env.h + rand(5, 40) : rand(env.h * 0.6, env.h), r: rand(1.5, 4), rise: rand(0.2, 0.5), phase: rand(0, TAU) });
  return {
    resize: () => resizeList(bubbles, budget(env, 40000, 8, 26), () => make()),
    frame(ctx, dt, t) {
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 4; i++) {
        const base = env.h * (0.8 + i * 0.055);
        const amp = 4 + i * 2.5;
        const len = 200 + i * 40;
        ctx.strokeStyle = rgba(env.colors[2], 0.1 + i * 0.03);
        ctx.beginPath();
        for (let x = 0; x <= env.w + 10; x += 10) {
          const y = base + amp * Math.sin((x / len) * TAU + t * 0.0007 * (1 + i * 0.3) + i);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (const b of bubbles) {
        b.y -= b.rise * dt;
        b.x += Math.sin(t * 0.002 + b.phase) * 0.2 * dt;
        if (b.y < env.h * 0.55) Object.assign(b, make(true));
        const a = Math.min(1, (b.y - env.h * 0.55) / (env.h * 0.15));
        ctx.strokeStyle = rgba(env.colors[1], 0.5 * a);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, TAU);
        ctx.stroke();
      }
    },
  };
}

/* ---- Swallowed, The Depths: glowing motes, rising bubbles, and something vast ----- */

function depths(env: Env): Scene {
  interface Mote { x: number; y: number; vx: number; vy: number; phase: number; rate: number; size: number; color: RGB }
  interface Bubble { x: number; y: number; r: number; rise: number }
  const motes: Mote[] = [];
  const bubbles: Bubble[] = [];
  let pass = { start: performance.now() + rand(4000, 9000), dur: 26000, y: 0.5, dir: 1 };
  const makeMote = (): Mote => ({
    x: rand(0, env.w), y: rand(0, env.h), vx: rand(-0.08, 0.08), vy: rand(-0.1, 0.03),
    phase: rand(0, TAU), rate: rand(0.001, 0.003), size: rand(0.8, 2.2), color: env.colors[Math.random() < 0.7 ? 0 : 1]!,
  });
  const makeBubble = (bottom = true): Bubble => ({ x: rand(0, env.w), y: bottom ? env.h + rand(5, 60) : rand(0, env.h), r: rand(1.5, 5), rise: rand(0.3, 0.8) });
  return {
    resize() {
      resizeList(motes, budget(env, 9000, 30, 150), makeMote);
      resizeList(bubbles, budget(env, 60000, 5, 18), () => makeBubble(false));
    },
    frame(ctx, dt, t) {
      // Now and then, a great shape glides slowly across the deep.
      const age = (t - pass.start) / pass.dur;
      if (age > 1) pass = { start: t + rand(12000, 26000), dur: rand(22000, 32000), y: rand(0.3, 0.7), dir: Math.random() < 0.5 ? 1 : -1 };
      else if (age > 0) {
        const len = Math.max(env.w * 0.55, 420);
        const x = pass.dir > 0 ? -len + (env.w + 2 * len) * age : env.w + len - (env.w + 2 * len) * age;
        const y = env.h * pass.y + Math.sin(t * 0.0004) * 20;
        const fade = Math.min(1, age * 6, (1 - age) * 6);
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(pass.dir, 1);
        ctx.fillStyle = rgba(env.colors[2], 0.55 * fade);
        ctx.beginPath();
        ctx.moveTo(len * 0.5, 0);
        ctx.bezierCurveTo(len * 0.42, -len * 0.16, len * 0.05, -len * 0.2, -len * 0.3, -len * 0.06);
        ctx.lineTo(-len * 0.5, -len * 0.16);
        ctx.lineTo(-len * 0.44, 0);
        ctx.lineTo(-len * 0.5, len * 0.14);
        ctx.lineTo(-len * 0.3, len * 0.05);
        ctx.bezierCurveTo(len * 0.05, len * 0.16, len * 0.42, len * 0.13, len * 0.5, 0);
        ctx.fill();
        ctx.restore();
      }
      ctx.globalCompositeOperation = "lighter";
      for (const m of motes) {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        if (m.y < -10) m.y = env.h + 10;
        else if (m.y > env.h + 10) m.y = -10;
        if (m.x < -10) m.x = env.w + 10;
        else if (m.x > env.w + 10) m.x = -10;
        const glow = 0.25 + 0.75 * Math.max(0, Math.sin(t * m.rate + m.phase)) ** 2;
        const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.size * 5);
        g.addColorStop(0, rgba(m.color, 0.6 * glow));
        g.addColorStop(1, rgba(m.color, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size * 5, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = 1;
      for (const b of bubbles) {
        b.y -= b.rise * dt;
        b.x += Math.sin(t * 0.002 + b.r) * 0.15 * dt;
        if (b.y < -10) Object.assign(b, makeBubble());
        ctx.strokeStyle = rgba(env.colors[0], 0.25);
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, TAU);
        ctx.stroke();
      }
    },
  };
}

/* ---- Empty Tomb, First Light: gold motes rising through low sunbeams ------------ */

function firstLight(env: Env): Scene {
  interface Mote { x: number; y: number; rise: number; sway: number; phase: number; size: number; color: RGB }
  const motes: Mote[] = [];
  const make = (bottom = false): Mote => ({
    x: rand(0, env.w), y: bottom ? env.h + rand(5, 40) : rand(0, env.h), rise: rand(0.08, 0.28), sway: rand(0.1, 0.4),
    phase: rand(0, TAU), size: rand(1, 2.6), color: env.colors[Math.random() < 0.6 ? 0 : Math.random() < 0.5 ? 1 : 2]!,
  });
  return {
    resize: () => resizeList(motes, budget(env, 14000, 30, 110), () => make()),
    frame(ctx, dt, t) {
      // Low beams from the upper left, turning very slowly as the sun climbs.
      ctx.globalCompositeOperation = "lighter";
      const len = Math.hypot(env.w, env.h) * 1.2;
      for (let i = 0; i < 4; i++) {
        const a = 0.55 + i * 0.12 + Math.sin(t * 0.00006 + i) * 0.04;
        const spread = 0.035 + i * 0.008;
        const g = ctx.createLinearGradient(-40, -40, Math.cos(a) * len, Math.sin(a) * len);
        g.addColorStop(0, rgba(env.colors[1], 0.14));
        g.addColorStop(1, rgba(env.colors[1], 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(-40, -40);
        ctx.lineTo(-40 + Math.cos(a - spread) * len, -40 + Math.sin(a - spread) * len);
        ctx.lineTo(-40 + Math.cos(a + spread) * len, -40 + Math.sin(a + spread) * len);
        ctx.closePath();
        ctx.fill();
      }
      for (const m of motes) {
        m.y -= m.rise * dt;
        m.x += Math.sin(t * 0.0012 + m.phase) * m.sway * dt;
        if (m.y < -10) Object.assign(m, make(true));
        const glint = 0.45 + 0.55 * Math.sin(t * 0.002 + m.phase) ** 2;
        ctx.fillStyle = rgba(m.color, 0.6 * glint);
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    },
  };
}

/* ---- Empty Tomb, Still Dark: stars fading as the horizon slowly warms ----------- */

function stillDark(env: Env): Scene {
  interface Star { x: number; y: number; r: number; phase: number; rate: number }
  const sky: Star[] = [];
  return {
    resize: () => resizeList(sky, budget(env, 9000, 40, 160), () => ({ x: rand(0, env.w), y: env.h * Math.random() ** 1.4 * 0.85, r: rand(0.4, 1.3), phase: rand(0, TAU), rate: rand(0.5, 1.6) })),
    frame(ctx, _dt, t) {
      // A long cycle: the dawn comes on and the stars give way to it, then it begins again.
      const dawn = 0.5 - 0.5 * Math.cos(t * 0.00009);
      const g = ctx.createRadialGradient(env.w / 2, env.h * 1.15, 0, env.w / 2, env.h * 1.15, env.h * 0.9);
      g.addColorStop(0, rgba(env.colors[2], 0.1 + 0.18 * dawn));
      g.addColorStop(0.5, rgba(env.colors[1], 0.05 + 0.1 * dawn));
      g.addColorStop(1, rgba(env.colors[1], 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, env.w, env.h);
      for (const s of sky) {
        // Stars low on the page fade first as the light comes up behind them.
        const low = s.y / env.h;
        const fade = Math.max(0, 1 - dawn * (0.7 + low));
        ctx.fillStyle = rgba(env.colors[0], (0.35 + 0.4 * Math.sin(t * 0.001 * s.rate + s.phase)) * fade);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TAU);
        ctx.fill();
      }
    },
  };
}

const scenes: Record<AmbientScene, (env: Env) => Scene> = {
  sirocco,
  stars,
  petals,
  fireflies,
  downpour,
  storm,
  tongues,
  torches,
  wine,
  lamps,
  shofar,
  camp,
  blaze,
  inferno,
  glints,
  lanterns,
  wind,
  "tongues-of-fire": tonguesOfFire,
  prism: (env) => prism(env, false),
  radiance: (env) => prism(env, true),
  pasture,
  fold,
  tesserae,
  "many-lights": manyLights,
  surf,
  depths,
  "first-light": firstLight,
  "still-dark": stillDark,
};

/** Resolves any CSS color (oklch included) to RGB by painting one pixel. */
function resolveColor(css: string, probe: CanvasRenderingContext2D): RGB {
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = "#808080";
  probe.fillStyle = css;
  probe.fillRect(0, 0, 1, 1);
  const [r = 128, g = 128, b = 128] = probe.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

function readColors(): Env["colors"] {
  const style = getComputedStyle(document.documentElement);
  const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
  const read = (i: number) => resolveColor(style.getPropertyValue(`--gt-ambient-${i}`).trim() || "#808080", probe);
  return [read(1), read(2), read(3)];
}

function readSpectrum(): RGB[] {
  const style = getComputedStyle(document.documentElement);
  const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
  // Great Flood's chart palette, reordered outside-in: red, amber, green, blue, violet.
  return [4, 2, 3, 1, 5]
    .map((n) => style.getPropertyValue(`--chart-${n}`).trim())
    .filter(Boolean)
    .map((css) => resolveColor(css, probe));
}

/** Starts a scene on the canvas and returns a function that stops it. */
export function startScene(canvas: HTMLCanvasElement, name: AmbientScene, { density = 1 } = {}): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const env: Env = { w: 0, h: 0, colors: readColors(), spectrum: readSpectrum(), density };
  const scene = scenes[name](env);

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    env.w = window.innerWidth;
    env.h = window.innerHeight;
    canvas.width = Math.round(env.w * dpr);
    canvas.height = Math.round(env.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scene.resize();
  };
  resize();
  window.addEventListener("resize", resize);

  let raf = 0;
  let last = performance.now();
  const root = document.documentElement;
  const loop = (now: number) => {
    // During a theme switch an overlay covers the page; drawing underneath it is wasted work
    // competing with the switch. Hold the current frame until the switch is over.
    if (root.hasAttribute("data-gt-transition")) {
      last = now;
      raf = requestAnimationFrame(loop);
      return;
    }
    // dt is in 60fps frames, capped so a stalled tab does not teleport everything.
    const dt = Math.min(now - last, 50) / (1000 / 60);
    last = now;
    ctx.clearRect(0, 0, env.w, env.h);
    scene.frame(ctx, dt, now);
    raf = requestAnimationFrame(loop);
  };
  const onVisibility = () => {
    cancelAnimationFrame(raf);
    if (document.visibilityState === "visible") {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  };
  document.addEventListener("visibilitychange", onVisibility);
  raf = requestAnimationFrame(loop);
  canvas.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1400, easing: "ease-out" });

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onVisibility);
    ctx.clearRect(0, 0, env.w, env.h);
  };
}
