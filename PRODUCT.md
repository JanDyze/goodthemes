# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
npm package `goodthemes`: plain CSS theme files plus a small React client library (ThemeProvider, useTheme, ambient effects), built with tsup. A Vite + React + Tailwind v4 playground previews the themes. Chosen by the user: npm package over a shadcn registry ("npm package (Recommended)"); the build tooling was delegated.

## Users
The author (Dyze), building their own web apps, starting with Kept (Next.js 16, React 19, Tailwind v4, shadcn "base-nova"). They want to give an app a fun, named atmosphere by installing one package, not by hand-tuning tokens in each project.

## Product Purpose
A library of fun, full-atmosphere themes that any of the author's projects can install and switch between at runtime. Success means adding `goodthemes` to a shadcn/Tailwind app turns it into Exile or Eden with no changes to its components, and switching themes feels like an event, not a flicker.

## Positioning
Each theme is a named atmosphere (Exile, Eden), not just a palette. It changes color, type, shape, surface texture, component touches, the theme-switch transition and an optional ambient layer, all through the shadcn CSS-variable contract that the author's apps already use.

## Operating Context
- Consumers are shadcn/Tailwind v4 apps that use the standard shadcn tokens (`--background`, `--primary`, `--radius`, `--chart-*`, `--sidebar-*`) and a `.dark` class. Components carry `data-slot` attributes.
- Kept is the first consumer (a Scripture memorization app).
- Distribution starts as a local install (`npm install ../goodthemes`) and may be published to npm later.

## Capabilities and Constraints
- Themes at launch: **Exile** (desert/wilderness) and **Eden** (garden), each with light and dark.
- Depth: full atmosphere. Palette, type, radius and shadow, background texture, component touches and signature motion. The ambient effect is opt-in, and every decorative layer can be switched off. (User answer: "Full atmosphere".)
- Must stay usable as application UI: text contrast, focus visibility and reduced-motion preferences are respected.
- Inferred (not confirmed): consumers are React apps. The CSS works without React; the provider needs React 18 or later.

## Brand Commitments
- Package name `goodthemes` (user's choice).
- Theme names Exile and Eden (user's choice). Exile carries a desert vibe; Eden is garden-like.

## Evidence on Hand
None beyond the Kept codebase at `../Kept`. No users, testimonials or benchmarks exist; none are to be invented.

## Product Principles
1. A theme is more than a swatch: every layer moves together.
2. Drop-in: never require the consuming app to edit its components.
3. Every flourish can be switched off, and reduced motion is honored by default.
4. The CSS carries the theme; JavaScript only switches and animates it.
