<img src="assets/logo.svg" alt="" width="72" height="72">

# goodthemes

Full-atmosphere themes for shadcn/Tailwind apps. A theme is more than a palette. Switching one changes:

- color and radius
- type
- surface texture
- component touches
- the switch transition
- an optional ambient scene

It all works through the CSS variables shadcn already uses, so your components don't change.

Each theme is drawn from a part of the story:

| Theme | Light / Dark | Type | Ambient (day / night) | Switch | Sigil |
|---|---|---|---|---|---|
| **First Garden** | Morning / Evening | Caprasimo, Figtree, Gelasio | falling petals / fireflies | blooms out from your click | a four-petal bloom in a ring |
| **Exile**, the wilderness | Noon / Night | Reem Kufi, Alegreya Sans, Alegreya | wind-blown sand / stars and shooting stars | a wind front sweeps across | a broken ring in a diamond |
| **Great Flood** | Forty Days / The Deep | Alfa Slab One, Karla, Spectral | squalls with a rainbow between / night storm | the water rises | breaking waves in a falling triangle |
| **Unfinished Tower** | The Plain / Torchlight | Big Shoulders Display, Hanken Grotesk, Cardo | letters of every script scattering / lit terraces | laid course by course | a tower split down the middle, in a hexagon |
| **Fallen Walls** | Seventh Day / Scarlet Cord | Rammetto One, Onest, Vollkorn | horn blasts, the seventh the strongest / campfires | the old wall falls flat | the wall, one side fallen |
| **Shepherd**, the pasture | Green Pastures / The Fold | Bree Serif, Nunito, Gentium Book Plus | wool clouds drifting / a watch-fire under the stars | hills rise over the page | the crook and a sheep on the hills, in a shield |
| **Swallowed**, the deep | Dry Land / The Depths | Fredoka, Lexend, Merriweather | surf lapping / glowing motes, bubbles, a vast shape passing | two jaws close, then open | a whirlpool under the waves, three bubbles rising |
| **Furnace**, the fire | Seven Times / The Fourth Man | Grenze Gotisch, Onest, Vollkorn | tongues of flame and sparks / a hotter blaze | catches from the bottom | a figure standing in the flames |
| **Good Wine**, the wedding | The Feast / The Good Wine | Bodoni Moda (italic), Jost, EB Garamond | water turning to wine / strings of lamps | doors open from the middle | two water jars, a drop becoming wine |
| **Fishers of Men**, the lake | Daybreak / Night Watch | Young Serif, Albert Sans, Literata | sun glinting on water / boat lanterns | a ripple with a trailing ring | the fish over the net |
| **Empty Tomb**, the resurrection | First Light / Still Dark | Gloock, Manrope, Source Serif 4 | gold motes in low sunbeams / stars fading before dawn | the stone rolls in, then rolls away | the tomb in the hill under the morning star, in a sunburst |
| **Mighty Wind**, and tongues of fire | Rushing Wind / Tongues of Fire | Unbounded, Schibsted Grotesk, Petrona | streamlines of wind / cloven flames | a gust blows it in | a flame rising from the waters |
| **Ekklesia**, the church | Breaking Bread / Many Lights | Marcellus, Public Sans, Libre Baskerville | mosaic tiles being laid / lamps at every depth | mosaic tiles set down, then lifted | the chi-rho in an octagon |
| **Pearl Gates**, the city | The City / The Light Thereof | Cinzel, Mulish, Libre Caslon Text | glints of gold and stone / beams of light | opens like a cut gem | the gate of the city, under its star |

Each theme carries the scripture it was drawn from, in the King James text (public domain):

| Theme | Verse | Read the story |
|---|---|---|
| First Garden | Genesis 2:8 | Genesis 2:4–25, Genesis 3:1–24 |
| Exile | Isaiah 43:19 | Genesis 3:22–24, Deuteronomy 8:1–10 |
| Great Flood | Genesis 9:13 | Genesis 6:9–8:22, Genesis 9:8–17 |
| Unfinished Tower | Genesis 11:4 | Genesis 11:1–9, Acts 2:1–13 |
| Fallen Walls | Hebrews 11:30 | Joshua 6:1–27, Joshua 2:1–21 |
| Shepherd | Psalm 23:1–2 | Psalm 23:1–6, John 10:11–16 |
| Swallowed | Jonah 2:3 | Jonah 1:17–2:10, Matthew 12:38–41 |
| Furnace | Daniel 3:25 | Daniel 3:1–30, Isaiah 43:1–3 |
| Good Wine | John 2:10 | John 2:1–11, Revelation 19:6–9 |
| Fishers of Men | Matthew 4:19 | Luke 5:1–11, John 21:1–14 |
| Empty Tomb | Matthew 28:6 | Matthew 28:1–10, John 20:1–10 |
| Mighty Wind | Acts 2:2 | Acts 2:1–21, Joel 2:28–32 |
| Ekklesia | Acts 2:46 | Acts 2:41–47, Acts 20:7–12 |
| Pearl Gates | Revelation 21:23 | Revelation 21:1–27, Revelation 22:1–5 |

The verse text and readings are available as `themes.<name>.inspiration` (or `useTheme().info.inspiration`). `passageUrl("Genesis 9:8-17")` returns a BibleGateway link.

```tsx
import { ThemeEmblem } from "goodthemes"; // also exported from "goodthemes/script"

<ThemeEmblem theme="exile" />                                 {/* 1em, decorative */}
<ThemeEmblem theme="good-wine" size={48} title="Good Wine" /> {/* sized, with an accessible name */}
<ThemeEmblem theme="pearl-gates" animate="enter-idle" />      {/* enters, then idles */}
```

`animate` takes:

| Value | Motion |
|---|---|
| `enter` | The sigil assembles piece by piece in the theme's manner: the frame first, then First Garden's petals unfold around the flower, Exile's broken pieces gather in from outside, Great Flood's waves swell up, Unfinished Tower's blocks drop into place bottom to top, Fallen Walls's stones fall in, Furnace's and Mighty Wind's flames kindle from their base, Good Wine's jars slide in from the sides, Fishers of Men ripples out from the fish, and Pearl Gates builds up from its steps with the stars last. Plays on mount; give the element a new `key` to replay it. |
| `idle` | A slow loop in the theme's manner: First Garden breathes, Exile sways, Great Flood bobs, Unfinished Tower leans, Fallen Walls trembles, Furnace and Mighty Wind flicker, Good Wine brightens, Fishers of Men rocks, Pearl Gates shimmers. |
| `enter-idle` | Enter, then idle. |
| `hover` | Idle only while the sigil, or the link or button around it, is hovered or focused. |

Motion comes from goodthemes' CSS (transform and opacity on the sigil and its pieces) and is off under `prefers-reduced-motion`. Without the CSS, sigils still render normally, just still.

The sigils are drawn in `currentColor`, so they take the color of the surrounding text. They render in Server Components too.

They are traced from the artwork in `assets/sigils.png` (light marks on black in a grid, in the order listed in `scripts/trace-emblems.mjs`, each named underneath). Themes not on the artwork yet (Shepherd, Swallowed, Empty Tomb and Ekklesia, for now) use placeholder sigils drawn by `npm run draw-sigils` into `src/emblem-drawn.ts`; once a theme is on the sheet and listed in the script, its traced sigil takes over. To change them, replace that image and run `npm run sigils`, which regenerates `src/emblem-paths.ts`: each sigil split into its pieces (every solid shape with its own holes), which is what lets them animate part by part.

## Use it in an app

```sh
npm install ../goodthemes   # local, for now
```

```css
/* globals.css: import after tailwindcss */
@import "tailwindcss";
@import "goodthemes/styles.css";   /* or base.css plus just the themes you want */
```

```tsx
// app/layout.tsx (Next.js App Router)
import { ThemeProvider } from "goodthemes";
import { ThemeScript } from "goodthemes/script"; // server-safe

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript defaultTheme="first-garden" />
      </head>
      <body>
        <ThemeProvider defaultTheme="first-garden" ambient>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Pass the same options to `ThemeScript` and `ThemeProvider`. The script applies the saved theme before first paint, so there is no flash.

```tsx
"use client";
import { useTheme } from "goodthemes";

function Switcher() {
  const { theme, setTheme, mode, setMode, ambient, setAmbient } = useTheme();
  // Pass the click event to start the transition from the pointer.
  return <button onClick={(e) => setTheme("exile", e)}>Exile</button>;
}
```

### Provider options

| Prop | Default | |
|---|---|---|
| `defaultTheme` | `null` | any theme name (`"first-garden"`, `"exile"`, … `"pearl-gates"`), or `null` to keep the app's own look |
| `defaultMode` | `"system"` | `"light"`, `"dark"` or `"system"`; toggles the `.dark` class |
| `ambient` | `false` | Ambient canvas scene. Always off under `prefers-reduced-motion` |
| `decor` | `true` | Texture, display headings, component touches (`data-gt-decor="off"` removes them) |
| `fonts` | `true` | Loads the theme's Google Fonts. Turn off if you self-host the faces |
| `transitions` | `true` | Animate switches with the theme's overlay (off under reduced motion) |
| `storageKey` | `"goodthemes"` | localStorage key |

`useTheme()` returns `theme`, `info` (name, mode names, fonts, inspiration), `mode`, `resolvedMode`, `ambient`, `decor`, their setters, and `preload(theme)`. `setTheme(name, event)` animates from the pointer; `setTheme(name, undefined, { transition: false })` switches instantly (for example when restoring a theme from the URL).

### Previewing a theme inside a page

`<ThemeScope theme="good-wine">` applies a theme to just its children, such as a card in a theme picker. Tokens, type, texture and component touches all resolve to the nearest theme, so a scope never leaks into the page around it, and the page's theme never leaks in.

```tsx
import { ThemeScope } from "goodthemes";

<ThemeScope theme="fishers-of-men" className="rounded-xl p-6">
  <Card>…</Card>  {/* renders in Fishers of Men, whatever the page is wearing */}
</ThemeScope>
```

It follows the page's light/dark mode unless you pass `mode`. Without React, put `data-gt-scope data-theme="fishers-of-men"` on any element.

## How it plugs in

- The theme lives on `<html data-theme="exile">` alongside `.dark`. Theme selectors are more specific than your `:root` and `.dark`, so import order doesn't matter.
- **Tokens:** every shadcn color token, plus `--radius`, `--font-sans`, `--font-heading` and `--font-serif`. Theme extras are prefixed `--gt-`, for example `--gt-font-display`, `--gt-texture`, `--gt-shadow` and `--gt-ease`.
- **Touches** target shadcn's `data-slot` attributes (`card`, `button`, `badge`, `card-title`). Each theme only sets variables such as `--gt-card-radius` or `--gt-primary-sheen`, and one shared rule applies them. That rule is unlayered so it wins over utility classes, and `decor={false}` turns it off.
- **Headings:** `h1`–`h3` and card titles get the display face.
- **Switching** plays an overlay: a layer in the incoming theme (with its sigil) covers the page, the theme is swapped underneath while nothing can see it, and the layer leaves. Only that layer moves, by transform and opacity, so switches stay smooth on heavy pages. Ambient scenes pause while it runs.
- **Ambient scene:** it sits behind the page at `z-index: -1`. That needs the page background on `<body>` (the shadcn default), not on `<html>`. Otherwise use `<Ambient layer="front" />`.

## Develop

```sh
npm install
npm run dev     # playground at http://localhost:5178
npm run build   # dist/: index.js, script.js, *.css
```

Theme sources are in `css/`. Textures are SVGs in `css/textures/`, inlined as data URIs at build time.

To add a theme:
1. Add `css/<name>.css` with the same token set, including its `--gt-*` touch variables.
2. Add an entry in `src/themes.ts` (name, modes, fonts, ambient scenes, inspiration).
3. Add a sigil in `src/emblem.tsx`, its switch motion in `src/overlay.ts`, and the overlay's shape in `css/base.css` if it needs one (an edge mask, doors, a growing shape).
4. Add it to `scripts/build-css.mjs` and the `exports` in `package.json`.

## Playground

`npm run dev` opens the gallery. `?theme=<name>` opens one theme's page, for example `http://localhost:5178/?theme=furnace`.
