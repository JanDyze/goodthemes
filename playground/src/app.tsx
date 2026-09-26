import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { ArrowDown, ArrowRight, Bookmark, BookmarkCheck, Check, ChevronLeft, ChevronRight, Copy, ExternalLink, Monitor, Moon, Plus, Share2, Sparkles, Sun } from "lucide-react";
import { ThemeEmblem, ThemeScope, isThemeName, passageUrl, themeNames, themes, useTheme, type Mode, type ThemeInfo, type ThemeName } from "goodthemes";
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Switch,
  Textarea,
  buttonVariants,
  cn,
} from "./ui";
import { Logo } from "./logo";

/** The page is chosen by ?theme=<name>: a theme's own page, or the gallery when absent. */
function useRoute() {
  const read = () => {
    const value = new URLSearchParams(window.location.search).get("theme");
    return isThemeName(value) ? value : null;
  };
  const [route, setRoute] = useState<ThemeName | null>(read);
  const { setTheme } = useTheme();
  // Arriving at ?theme=<name> directly, or through back/forward, applies that theme.
  // A click in the page switches the theme itself, so this must not run for those.
  useEffect(() => {
    const initial = read();
    if (initial) setTheme(initial, undefined, { transition: false });
    const onPop = () => {
      const next = read();
      setRoute(next);
      if (next) setTheme(next);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const go = useCallback((next: ThemeName | null) => {
    const url = next ? `?theme=${next}` : window.location.pathname;
    window.history.pushState(null, "", url);
    setRoute(next);
    window.scrollTo({ top: 0 });
  }, []);
  return [route, go] as const;
}

export function App() {
  const { preload, setTheme } = useTheme();
  const [route, go] = useRoute();

  // The gallery and the tab strip set each theme's name in its own face, so load them all.
  useEffect(() => {
    for (const name of themeNames) preload(name);
  }, [preload]);

  const open = (name: ThemeName, origin?: MouseEvent) => {
    go(name);
    setTheme(name, origin);
  };

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-4 sm:px-8">
      <TopBar onHome={() => go(null)} />
      <main className="flex flex-1 flex-col">
        {route ? (
          <>
            <ThemeStrip current={route} onPick={open} onGallery={() => go(null)} />
            <Stage />
            <InUse />
            <Install />
          </>
        ) : (
          <Landing onOpen={open} />
        )}
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t py-6 text-sm text-muted-foreground">
        <span>goodthemes 0.1.0</span>
        <span>Sample content. The names and numbers are made up.</span>
      </footer>
    </div>
  );
}

/* ---- Gallery: every theme at once, each card wearing its own theme ------------ */

/* ---- Landing: what goodthemes is, why use it, the themes, and how to install ---- */

function Landing({ onOpen }: { onOpen(name: ThemeName, origin?: MouseEvent): void }) {
  return (
    <>
      <Hero />
      <Why />
      <section id="themes" aria-labelledby="themes-title" className="scroll-mt-6 border-t pt-14 pb-16">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <h2 id="themes-title" className="font-heading text-4xl tracking-tight sm:text-5xl">
            Themes
          </h2>
          <p className="max-w-[46ch] text-pretty text-muted-foreground">
            <span className="tabular-nums">{themeNames.length}</span> so far, each drawn from a part of the story. Open
            one to see it on real components.
          </p>
        </div>
        <ul className="grid gap-5 md:grid-cols-2">
          {Object.values(themes).map((t) => (
            <li key={t.id}>
              <ThemeCard info={t} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      </section>
      <Install />
    </>
  );
}

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="grid justify-items-start gap-7 pt-10 pb-16 sm:pt-20 sm:pb-24">
      <Logo size={64} />
      <h1 id="hero-title" className="max-w-[15ch] font-heading text-5xl leading-[0.95] tracking-tight text-balance sm:text-7xl">
        Give your app an atmosphere, not just a palette
      </h1>
      <p className="max-w-[58ch] text-lg text-pretty text-muted-foreground sm:text-xl">
        goodthemes is a set of complete themes for shadcn and Tailwind apps. Each one changes color, type, texture,
        motion and an ambient scene, through the CSS variables your components already use.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <a href="#themes" data-slot="button" className={buttonVariants({ size: "lg" })}>
          See the themes <ArrowDown />
        </a>
        <a href="#install" data-slot="button" className={buttonVariants({ variant: "outline", size: "lg" })}>
          How to use it
        </a>
      </div>
      <div className="w-full max-w-md">
        <CodeBlock code={steps[0]!.code} />
      </div>
    </section>
  );
}

const reasons = [
  {
    title: "Drop in, no component changes",
    body: "It uses shadcn's own CSS variables and data-slot attributes, so the buttons, cards and inputs you already have take on the theme without an edit.",
  },
  {
    title: "More than a color swap",
    body: "Each theme brings its own typefaces, radius, shadows, surface texture and small component touches, in light and dark.",
  },
  {
    title: "Switching is a moment",
    body: "The incoming theme's overlay and sigil cover the page while the swap happens underneath, so a switch stays smooth even on a heavy page.",
  },
  {
    title: "Every flourish can be turned off",
    body: "Ambient scenes are opt-in, decoration is one flag, and reduced-motion settings turn the motion off.",
  },
  {
    title: "Each theme has a story",
    body: "A sigil, a verse and the passages behind it come with every theme, ready for your app to show.",
  },
];

// Three themes for the side-by-side proof, spread across the palette.
const proofThemes: ThemeName[] = ["eden", "furnace", "zion"];

function Why() {
  return (
    <section aria-labelledby="why-title" className="grid gap-12 border-t py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] lg:gap-16">
      <div>
        <h2 id="why-title" className="mb-8 font-heading text-4xl tracking-tight sm:text-5xl">
          Why goodthemes
        </h2>
        <dl className="divide-y">
          {reasons.map((r) => (
            <div key={r.title} className="grid gap-1.5 py-5 first:pt-0 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:gap-8">
              <dt className="font-medium">{r.title}</dt>
              <dd className="text-pretty text-muted-foreground">{r.body}</dd>
            </div>
          ))}
        </dl>
      </div>
      <figure className="grid content-start gap-3">
        <figcaption className="text-sm text-muted-foreground">The same stock card, wrapped in three themes.</figcaption>
        {proofThemes.map((t) => (
          <ThemeScope key={t} theme={t} className="rounded-2xl p-4 ring-1 ring-black/10 dark:ring-white/10">
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <ThemeEmblem theme={t} size={18} className="text-primary" />
              {themes[t].name}
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Weekly summary</CardTitle>
                <CardDescription>12 tasks closed, 3 to go</CardDescription>
                <CardAction>
                  <Badge variant="secondary">New</Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button size="sm">Open</Button>
                <Button size="sm" variant="outline">
                  Later
                </Button>
              </CardContent>
            </Card>
          </ThemeScope>
        ))}
      </figure>
    </section>
  );
}

function ThemeCard({ info, onOpen }: { info: ThemeInfo; onOpen(name: ThemeName, origin?: MouseEvent): void }) {
  const stripes = ["primary", "secondary", "accent", "chart-1", "chart-2", "chart-3", "chart-4", "chart-5"];
  // Hovering (or focusing) a card plays its sigil's entrance, piece by piece, then its idle loop.
  // Each new hover remounts the sigil (a new key), so the entrance plays again.
  const [play, setPlay] = useState(0);
  const [active, setActive] = useState(false);
  const start = () => {
    if (active) return;
    setActive(true);
    setPlay((n) => n + 1);
  };
  const stop = () => setActive(false);
  return (
    <ThemeScope theme={info.id} className="h-full overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/10 transition-shadow hover:shadow-lg dark:ring-white/10">
      <a
        href={`?theme=${info.id}`}
        onPointerEnter={start}
        onPointerLeave={stop}
        onFocus={start}
        onBlur={stop}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          onOpen(info.id, event);
        }}
        className="group flex h-full flex-col gap-6 p-6 outline-none focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:ring-inset sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <ThemeEmblem key={play} theme={info.id} animate={active ? "enter-idle" : undefined} size={48} className="text-primary" />
          <span className="text-right text-xs text-muted-foreground">
            {info.modes.light} · {info.modes.dark}
          </span>
        </div>
        <div className="flex-1">
          <h2 className="text-5xl leading-none tracking-tight sm:text-6xl">{info.name}</h2>
          <p className="mt-3 max-w-[42ch] text-pretty text-muted-foreground">{info.tagline}</p>
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full">
          {stripes.map((token) => (
            <span key={token} className="flex-1" style={{ background: `var(--${token})` }} />
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span data-slot="button" className={cn(buttonVariants(), "pointer-events-none")}>
            Open {info.name} <ArrowRight />
          </span>
          <span className="font-serif text-sm text-muted-foreground italic">{info.inspiration.reference}</span>
        </div>
      </a>
    </ThemeScope>
  );
}

/* ---- Theme strip: one line of tabs, faded at the edges, with chevrons --------- */

function ThemeStrip({
  current,
  onPick,
  onGallery,
}: {
  current: ThemeName;
  onPick(name: ThemeName, origin?: MouseEvent): void;
  onGallery(): void;
}) {
  const { preload } = useTheme();
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft > 2, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
  }, []);

  useEffect(() => {
    measure();
    const el = scroller.current;
    const ro = new ResizeObserver(measure);
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  // Keep the current theme's tab in view when it changes.
  useEffect(() => {
    // Scroll only the strip (scrollIntoView would also scroll the page), and again once the
    // web fonts land, since every tab changes width when its face arrives.
    const center = (behavior: ScrollBehavior) => {
      const el = scroller.current;
      const tab = el?.querySelector<HTMLElement>(`[data-theme-tab="${current}"]`);
      if (el && tab) {
        const offset = tab.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft;
        el.scrollTo({ left: offset - (el.clientWidth - tab.offsetWidth) / 2, behavior });
      }
      measure();
    };
    center("smooth");
    let live = true;
    document.fonts.ready.then(() => live && center("auto"));
    return () => {
      live = false;
    };
  }, [current, measure]);

  const page = (direction: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.75, behavior: "smooth" });
  };

  const fade = `linear-gradient(to right, ${edges.start ? "transparent, #000 56px" : "#000"}, ${edges.end ? "#000 calc(100% - 56px), transparent" : "#000"})`;

  return (
    <nav aria-label="Themes" className="flex items-center gap-2 pt-4 sm:pt-6">
      <button
        type="button"
        onClick={onGallery}
        className={cn("mr-2 shrink-0 rounded-md text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50", tabColors)}
      >
        All themes
      </button>
      <Button variant="ghost" size="icon" aria-label="Previous themes" disabled={!edges.start} onClick={() => page(-1)} className="shrink-0 text-neutral-600 disabled:opacity-25 dark:text-neutral-400">
        <ChevronLeft />
      </Button>
      <div
        ref={scroller}
        onScroll={measure}
        className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ maskImage: fade, WebkitMaskImage: fade }}
      >
        <div className="flex w-max items-center gap-7 px-1 py-2">
          {Object.values(themes).map((option) => (
            <button
              key={option.id}
              type="button"
              data-theme-tab={option.id}
              aria-pressed={current === option.id}
              onClick={(event) => onPick(option.id, event)}
              onPointerEnter={() => preload(option.id)}
              style={{ fontFamily: `"${option.fonts.display}", var(--font-sans)` }}
              className={cn(
                "flex items-center gap-2 rounded-md text-xl leading-none whitespace-nowrap underline-offset-8 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:text-2xl",
                tabColors,
              )}
            >
              <ThemeEmblem theme={option.id} size="1.1em" className="shrink-0" />
              {option.name}
            </button>
          ))}
        </div>
      </div>
      <Button variant="ghost" size="icon" aria-label="Next themes" disabled={!edges.end} onClick={() => page(1)} className="shrink-0 text-neutral-600 disabled:opacity-25 dark:text-neutral-400">
        <ChevronRight />
      </Button>
    </nav>
  );
}

/* ---- Top bar ----------------------------------------------------------------- */

const modeOptions: { mode: Mode; label: string; Icon: typeof Sun }[] = [
  { mode: "light", label: "Light", Icon: Sun },
  { mode: "dark", label: "Dark", Icon: Moon },
  { mode: "system", label: "Match system", Icon: Monitor },
];

function TopBar({ onHome }: { onHome(): void }) {
  const { mode, setMode, ambient, setAmbient, decor, setDecor } = useTheme();
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5">
      <a
        href="/"
        onClick={(event) => {
          event.preventDefault();
          onHome();
        }}
        className="flex items-center gap-2.5 rounded-md font-heading text-xl tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Logo size={30} className="shrink-0" />
        goodthemes
      </a>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Toggle label="Ambient" checked={ambient} onChange={setAmbient} />
        <Toggle label="Decor" checked={decor} onChange={setDecor} />
        <div role="group" aria-label="Color mode" className="flex rounded-lg border bg-card/70 p-0.5">
          {modeOptions.map(({ mode: value, label, Icon }) => (
            <Button
              key={value}
              variant="ghost"
              size="icon"
              aria-label={label}
              aria-pressed={mode === value}
              title={label}
              onClick={(event) => setMode(value, event)}
              className="size-7 aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
            >
              <Icon />
            </Button>
          ))}
        </div>
      </div>
    </header>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange(on: boolean): void }) {
  const id = `toggle-${label.toLowerCase()}`;
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="text-muted-foreground">
        {label}
      </Label>
    </div>
  );
}

/* ---- Stage: the theme at full scale -------------------------------------------- */

// The theme tabs keep one look whichever theme is active: neutral grays that only follow light/dark.
const tabColors =
  "text-neutral-600 hover:text-neutral-950 aria-pressed:text-neutral-950 aria-pressed:underline aria-pressed:decoration-2 dark:text-neutral-400 dark:hover:text-neutral-50 dark:aria-pressed:text-neutral-50";

function Stage() {
  const { info, resolvedMode } = useTheme();

  return (
    <section aria-labelledby="stage-title" className="grid gap-10 pt-8 pb-16 sm:pt-12 lg:grid-cols-[1fr_auto] lg:items-end">
      <div className="min-w-0 @container">
        {/* Sized to the column and the name's length, so wide faces and long names both fit. */}
        <h1
          id="stage-title"
          className="font-heading leading-[0.85] tracking-tight"
          style={{ fontSize: `min(10rem, calc(100cqi / ${((info?.name ?? "Your app").length + 1) * 0.82}))` }}
        >
          {info ? <ThemeEmblem key={info.id} theme={info.id} animate="enter-idle" size="0.62em" className="mr-[0.12em] mb-[0.08em] inline-block text-primary" /> : null}
          {info?.name ?? "Your app"}
        </h1>
        <p className="mt-6 max-w-[34ch] text-lg text-pretty text-muted-foreground sm:text-xl">
          {info ? (
            <>
              <span className="font-medium text-foreground">{info.modes[resolvedMode]}.</span> {info.tagline}
            </>
          ) : (
            "Stock shadcn tokens, untouched. This is what an app looks like before a theme is applied."
          )}
        </p>
        {info ? (
          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {(
              [
                ["Display", info.fonts.display, "var(--gt-font-display)"],
                ["Body", info.fonts.body, "var(--gt-font-body)"],
                ["Serif", info.fonts.serif, "var(--gt-font-serif)"],
              ] as const
            ).map(([role, face, family]) => (
              <div key={role} className="flex items-baseline gap-2">
                <dt className="text-muted-foreground">{role}</dt>
                <dd className="text-base" style={{ fontFamily: family }}>
                  {face}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      <Palette />
      {info ? <Inspiration inspiration={info.inspiration} /> : null}
    </section>
  );
}

/** The verse the theme is drawn from, and where to read the whole story. */
function Inspiration({ inspiration }: { inspiration: ThemeInfo["inspiration"] }) {
  const { verse, reference, translation, readings } = inspiration;
  return (
    <div className="grid gap-8 border-t pt-10 md:grid-cols-[1fr_auto] md:items-end md:gap-16 lg:col-span-2">
      <figure className="max-w-[44ch]">
        <blockquote className="font-serif text-2xl leading-snug text-pretty sm:text-3xl">
          <p>{verse}</p>
        </blockquote>
        <figcaption className="mt-4 text-sm text-muted-foreground">
          <cite className="font-medium text-foreground not-italic">{reference}</cite> · {translation}
        </figcaption>
      </figure>
      <nav aria-label="Read the story" className="grid content-end gap-3 md:min-w-64">
        <h3 className="text-sm font-normal text-muted-foreground" style={{ fontFamily: "var(--gt-font-body)" }}>
          Read the story
        </h3>
        <ul className="grid gap-2.5">
          {readings.map((reading) => (
            <li key={reading.passage}>
              <a
                href={passageUrl(reading.passage, translation)}
                target="_blank"
                rel="noreferrer"
                className="group flex items-baseline justify-between gap-6 rounded-sm border-b pb-2.5 outline-none hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="font-medium">{reading.title}</span>
                <span className="flex items-center gap-1.5 text-sm whitespace-nowrap text-muted-foreground group-hover:text-foreground">
                  {reading.passage.replace("-", "–")}
                  <ExternalLink className="size-3.5" aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

const paletteTokens = [
  ["primary", "Primary"],
  ["secondary", "Secondary"],
  ["accent", "Accent"],
  ["muted", "Muted"],
  ["card", "Card"],
  ["foreground", "Ink"],
] as const;

const stripeText: Record<(typeof paletteTokens)[number][0], string> = {
  primary: "primary-foreground",
  secondary: "secondary-foreground",
  accent: "accent-foreground",
  muted: "muted-foreground",
  card: "card-foreground",
  foreground: "background",
};

/** The palette as a woven band: each token a vertical stripe, charts as a thin weft underneath. */
function Palette() {
  return (
    <figure className="w-full lg:w-72" aria-label="Palette">
      <div className="flex h-44 overflow-hidden rounded-lg ring-1 ring-foreground/10 lg:h-64">
        {paletteTokens.map(([token, label], i) => (
          <div
            key={token}
            className="group relative flex flex-1 items-end transition-[flex-grow] duration-500 hover:flex-[2.4]"
            style={{ background: `var(--${token})`, flexGrow: i === 0 ? 2.2 : undefined }}
          >
            <span
              className="mb-2 ml-2 origin-bottom-left -rotate-90 translate-x-4 text-xs font-medium whitespace-nowrap opacity-80"
              style={{ color: `var(--${stripeText[token]})` }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex h-2.5 gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className="flex-1 rounded-full" style={{ background: `var(--chart-${n})` }} />
        ))}
      </div>
      <figcaption className="mt-2 text-xs text-muted-foreground">Hover a stripe to widen it. The thin band is the chart palette.</figcaption>
    </figure>
  );
}

/* ---- In use: the theme on stock components --------------------------------------- */

function InUse() {
  return (
    <section aria-labelledby="in-use-title" className="border-t py-14">
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="in-use-title" className="font-heading text-3xl tracking-tight sm:text-4xl">
          On real components
        </h2>
        <p className="max-w-[46ch] text-muted-foreground">
          Stock shadcn button, card, badge, input and switch. None of them know goodthemes exists.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <div className="grid content-start gap-5">
          <ArticleCard />
          <NewProjectCard />
        </div>
        <div className="grid content-start gap-5">
          <WeekCard />
          <TasksCard />
        </div>
      </div>
    </section>
  );
}

function ArticleCard() {
  const [saved, setSaved] = useState(false);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">The long way round</CardTitle>
        <CardDescription>Essay · 6 min read</CardDescription>
        <CardAction>
          <Badge variant="secondary">
            <Sparkles /> Editor’s pick
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="font-serif text-xl leading-relaxed text-pretty sm:text-2xl">
          Every shortcut we took that year cost us a week somewhere else. The slow road, it turned out, was the only one
          that went anywhere worth arriving.
        </p>
      </CardContent>
      <CardFooter className="flex-wrap justify-between gap-2">
        <Button variant="outline" aria-pressed={saved} onClick={() => setSaved((v) => !v)}>
          {saved ? <BookmarkCheck /> : <Bookmark />} {saved ? "Saved" : "Save for later"}
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost">
            <Share2 /> Share
          </Button>
          <Button>
            Keep reading <ArrowRight />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function NewProjectCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a project</CardTitle>
        <CardDescription>You can change the name and description later.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={(event) => event.preventDefault()}>
          <div className="grid gap-2">
            <Label htmlFor="project-name">Name</Label>
            <Input id="project-name" placeholder="Spring launch" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea id="project-description" placeholder="What is this project for?" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit">
              <Plus /> Create project
            </Button>
            <Button type="button" variant="secondary">
              Use a template
            </Button>
            <Button type="button" variant="link" className="ml-auto">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

const week = [
  { day: "Mon", visits: 162, signups: 11 },
  { day: "Tue", visits: 218, signups: 17 },
  { day: "Wed", visits: 131, signups: 6 },
  { day: "Thu", visits: 264, signups: 22 },
  { day: "Fri", visits: 197, signups: 15 },
  { day: "Sat", visits: 104, signups: 9 },
  { day: "Sun", visits: 208, signups: 16 },
];

const sources = [
  { name: "Search", share: 38 },
  { name: "Direct", share: 24 },
  { name: "Social", share: 18 },
  { name: "Referral", share: 12 },
  { name: "Email", share: 8 },
];

function WeekCard() {
  const max = Math.max(...week.map((d) => d.visits));
  return (
    <Card>
      <CardHeader>
        <CardTitle>This week</CardTitle>
        <CardDescription>
          <span className="tabular-nums">1,284</span> visits, <span className="tabular-nums">96</span> sign-ups
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex h-36 items-end gap-2" role="img" aria-label="Visits and sign-ups per day, Monday to Sunday">
          {week.map((d) => (
            <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <div className="flex w-full flex-1 items-end justify-center gap-0.5">
                <span className="w-1/2 max-w-3 rounded-t-sm bg-chart-1" style={{ height: `${(d.visits / max) * 100}%` }} />
                <span className="w-1/2 max-w-3 rounded-t-sm bg-chart-2" style={{ height: `${((d.signups * 4) / max) * 100}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
        <div className="grid gap-2">
          <div className="flex h-3 overflow-hidden rounded-full">
            {sources.map((s, i) => (
              <span key={s.name} style={{ width: `${s.share}%`, background: `var(--chart-${i + 1})` }} />
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {sources.map((s, i) => (
              <li key={s.name} className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: `var(--chart-${i + 1})` }} />
                {s.name} <span className="tabular-nums">{s.share}%</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

const tasks = [
  { title: "Update onboarding copy", note: "In progress", variant: "default" },
  { title: "Review pull request #212", note: "Today", variant: "secondary" },
  { title: "Fix login redirect", note: "Overdue", variant: "destructive" },
  { title: "Plan next quarter", note: "Next week", variant: "outline" },
] as const;

function TasksCard() {
  const [digest, setDigest] = useState(true);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
        <CardDescription>Assigned to you</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {tasks.map((task) => (
            <li key={task.title} className="flex items-center justify-between gap-3 py-2.5">
              <span className="font-medium">{task.title}</span>
              <Badge variant={task.variant}>{task.note}</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <Label htmlFor="digest" className="text-muted-foreground">
          Daily summary email
        </Label>
        <Switch id="digest" checked={digest} onCheckedChange={setDigest} />
      </CardFooter>
    </Card>
  );
}

/* ---- Install -------------------------------------------------------------------- */

const steps = [
  {
    title: "Install",
    code: `npm install ../goodthemes`,
  },
  {
    title: "Import the styles after your own tokens",
    code: `/* globals.css */
@import "tailwindcss";
@import "goodthemes/styles.css";`,
  },
  {
    title: "Wrap the app",
    code: `import { ThemeProvider } from "goodthemes";
import { ThemeScript } from "goodthemes/script";

<html suppressHydrationWarning>
  <head><ThemeScript defaultTheme="eden" /></head>
  <body>
    <ThemeProvider defaultTheme="eden" ambient>
      {children}
    </ThemeProvider>
  </body>
</html>`,
  },
  {
    title: "Switch themes from anywhere",
    code: `const { setTheme, setMode } = useTheme();

<button onClick={(e) => setTheme("exile", e)}>Exile</button>`,
  },
];

function Install() {
  return (
    <section id="install" aria-labelledby="install-title" className="scroll-mt-6 border-t py-14">
      <h2 id="install-title" className="mb-2 font-heading text-3xl tracking-tight sm:text-4xl">
        How to use it
      </h2>
      <p className="mb-8 max-w-[60ch] text-pretty text-muted-foreground">
        Four steps in a Next.js app with shadcn. Your components stay as they are.
      </p>
      <ol className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2">
        {steps.map((step, i) => (
          <li key={step.title} className="grid min-w-0 grid-cols-1 content-start gap-3">
            <h3 className="flex items-baseline gap-3 text-lg">
              <span className="text-muted-foreground tabular-nums">{i + 1}</span>
              {step.title}
            </h3>
            <CodeBlock code={step.code} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked: the text is still selectable.
    }
  };
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-card p-4 pr-12 font-mono text-[0.8rem] leading-relaxed ring-1 ring-foreground/10">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy code"}
        className="absolute top-2 right-2 size-7 text-muted-foreground"
      >
        {copied ? <Check /> : <Copy />}
      </Button>
    </div>
  );
}
