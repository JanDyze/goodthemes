import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Ambient, type AmbientProps } from "./ambient";
import { ThemeContext, type SwitchOptions, type ThemeContextValue, type TransitionOrigin } from "./context";
import { ThemeEmblem } from "./emblem";
import { ensureFonts, fontsReady } from "./fonts";
import { play, settle, type Effect, type Origin } from "./overlay";
import {
  DEFAULT_STORAGE_KEY,
  isThemeName,
  themes,
  type Mode,
  type ResolvedMode,
  type StoredState,
  type ThemeName,
} from "./themes";

export interface ThemeProviderProps {
  children?: ReactNode;
  storageKey?: string;
  /** Theme used until the visitor picks one. `null` keeps the app's own look. */
  defaultTheme?: ThemeName | null;
  defaultMode?: Mode;
  /** Ambient effects (sand, stars, petals, fireflies). Off unless you ask. */
  ambient?: boolean;
  /** Texture, display headings and component touches. */
  decor?: boolean;
  /** Load each theme's Google Fonts stylesheet. Turn off if you self-host the faces. */
  fonts?: boolean;
  /** Animate theme and mode switches with the incoming theme's overlay. */
  transitions?: boolean;
  /** Passed to the built-in <Ambient />. */
  ambientProps?: Omit<AmbientProps, "scene">;
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function readStored(key: string): Partial<StoredState> {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? "{}") as Record<string, unknown>;
    const out: Partial<StoredState> = {};
    if (raw.theme === null || isThemeName(raw.theme)) out.theme = raw.theme;
    if (raw.mode === "light" || raw.mode === "dark" || raw.mode === "system") out.mode = raw.mode;
    if (typeof raw.ambient === "boolean") out.ambient = raw.ambient;
    if (typeof raw.decor === "boolean") out.decor = raw.decor;
    return out;
  } catch {
    return {};
  }
}

function writeStored(key: string, state: StoredState) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Private mode or storage disabled: the choice lasts for this page view only.
  }
}

const darkQuery = "(prefers-color-scheme: dark)";
const subscribeDark = (notify: () => void) => {
  const mq = window.matchMedia(darkQuery);
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
};
const systemIsDark = () => window.matchMedia(darkQuery).matches;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function resolveMode(mode: Mode, systemDark: boolean): ResolvedMode {
  return mode === "system" ? (systemDark ? "dark" : "light") : mode;
}

function applyToDocument(state: StoredState, resolved: ResolvedMode) {
  const root = document.documentElement;
  if (state.theme) root.setAttribute("data-theme", state.theme);
  else root.removeAttribute("data-theme");
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  if (state.decor) root.removeAttribute("data-gt-decor");
  else root.setAttribute("data-gt-decor", "off");
}

function originPoint(origin: TransitionOrigin | undefined): { x: number; y: number } {
  const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const ofElement = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  if (!origin) return center;
  if (origin instanceof Element) return ofElement(origin);
  if ("clientX" in origin) {
    // Keyboard "clicks" report 0,0: start from the control instead.
    if (origin.clientX || origin.clientY) return { x: origin.clientX, y: origin.clientY };
    return origin.currentTarget instanceof Element ? ofElement(origin.currentTarget) : center;
  }
  return origin;
}

export function ThemeProvider({
  children,
  storageKey = DEFAULT_STORAGE_KEY,
  defaultTheme = null,
  defaultMode = "system",
  ambient: defaultAmbient = false,
  decor: defaultDecor = true,
  fonts = true,
  transitions = true,
  ambientProps,
}: ThemeProviderProps) {
  // Starts from the defaults on server and client alike so hydration matches, then picks up
  // the saved choice before the first paint. <ThemeScript> has already styled the page by then.
  const [state, setState] = useState<StoredState>({
    theme: defaultTheme,
    mode: defaultMode,
    ambient: defaultAmbient,
    decor: defaultDecor,
  });
  const [hydrated, setHydrated] = useState(false);
  const systemDark = useSyncExternalStore(subscribeDark, systemIsDark, () => false);
  const resolvedMode = resolveMode(state.mode, systemDark);

  const latest = useRef({ state, systemDark });
  latest.current = { state, systemDark };

  const hydratedRef = useRef(false);
  useIsoLayoutEffect(() => {
    setState((prev) => ({ ...prev, ...readStored(storageKey) }));
    setHydrated(true);
  }, [storageKey]);
  // Only once the saved choice has actually rendered: a child's mount effect can run before that.
  useIsoLayoutEffect(() => {
    if (hydrated) hydratedRef.current = true;
  }, [hydrated]);

  // Keeps the document in sync for changes that do not go through commit(), such as
  // the OS switching to dark while the mode is "system".
  useIsoLayoutEffect(() => {
    if (hydrated) applyToDocument(state, resolvedMode);
  }, [hydrated, state, resolvedMode]);

  useEffect(() => {
    if (hydrated && fonts && state.theme) ensureFonts(state.theme);
  }, [hydrated, fonts, state.theme]);

  // Another tab changed the theme.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey) setState((prev) => ({ ...prev, ...readStored(storageKey) }));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey]);

  // The overlay currently on screen, and the machinery to hand its element to commit().
  const [overlay, setOverlay] = useState<OverlayState | null>(null);
  const mounted = useRef<(el: HTMLElement) => void>(undefined);
  const running = useRef<Animation[]>([]);
  const run = useRef(0);
  // The state a switch in flight will leave behind, so a second switch builds on it.
  const pending = useRef<StoredState | null>(null);

  const commit = useCallback(
    async (patch: Partial<StoredState>, origin?: TransitionOrigin, options?: SwitchOptions) => {
      const { state: rendered, systemDark: dark } = latest.current;
      // A switch requested before hydration (e.g. from a child's mount effect) must build on the
      // saved choice, not the defaults, or it would overwrite the visitor's mode and settings.
      const current = hydratedRef.current ? rendered : { ...rendered, ...readStored(storageKey) };
      const prev = pending.current ?? current;
      const next = { ...prev, ...patch };
      const nextResolved = resolveMode(next.mode, dark);
      writeStored(storageKey, next);

      const apply = () => {
        applyToDocument(next, nextResolved);
        setState(next);
      };

      if (fonts && next.theme) ensureFonts(next.theme);

      // Any switch replaces one still in flight: stop its motion; it no longer owns the overlay.
      const id = ++run.current;
      for (const animation of running.current) animation.cancel();
      running.current = [];
      const root = document.documentElement;

      const looksDifferent = next.theme !== prev.theme || nextResolved !== resolveMode(prev.mode, dark);
      if (!looksDifferent || !transitions || options?.transition === false || prefersReducedMotion()) {
        pending.current = null;
        setOverlay(null);
        root.removeAttribute("data-gt-transition");
        apply();
        return;
      }

      pending.current = next;

      const { x, y } = originPoint(origin);
      const at: Origin = { x, y, reach: Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) };
      const effect: Effect = next.theme ?? "none";
      root.setAttribute("data-gt-transition", effect);

      try {
        const el = await new Promise<HTMLElement>((resolve) => {
          mounted.current = resolve;
          setOverlay({ id, effect, theme: next.theme, mode: nextResolved });
        });
        if (id !== run.current) return;
        await play(el, effect, "enter", at, running.current);
        if (id !== run.current) return;

        // The page is covered: swap the theme now, and let its fonts and styles land unseen.
        if (fonts && next.theme) await fontsReady(next.theme);
        if (id !== run.current) return;
        apply();
        await settle();
        if (id !== run.current) return;

        await play(el, effect, "exit", at, running.current);
      } catch {
        // Cancelled by a newer switch, which now owns the overlay.
        return;
      }
      if (id !== run.current) return;
      pending.current = null;
      running.current = [];
      setOverlay(null);
      root.removeAttribute("data-gt-transition");
    },
    [fonts, storageKey, transitions],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: state.theme,
      info: state.theme ? themes[state.theme] : null,
      mode: state.mode,
      resolvedMode,
      ambient: state.ambient,
      decor: state.decor,
      themes: Object.values(themes),
      setTheme: (theme, origin, options) => void commit({ theme }, origin, options),
      setMode: (mode, origin, options) => void commit({ mode }, origin, options),
      setAmbient: (ambient) => void commit({ ambient }),
      setDecor: (decor) => void commit({ decor }),
      preload: (theme) => {
        if (fonts) ensureFonts(theme);
      },
    }),
    [commit, fonts, resolvedMode, state],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
      {hydrated && state.ambient && state.theme ? <Ambient {...ambientProps} /> : null}
      {overlay ? <SwitchOverlay key={overlay.id} state={overlay} onMount={(el) => mounted.current?.(el)} /> : null}
    </ThemeContext.Provider>
  );
}

interface OverlayState {
  id: number;
  effect: Effect;
  theme: ThemeName | null;
  mode: ResolvedMode;
}

/** The layer a switch plays on: painted in the incoming theme, without its texture. */
function SwitchOverlay({ state, onMount }: { state: OverlayState; onMount(el: HTMLElement): void }) {
  return createPortal(
    <div
      ref={(el) => {
        if (el) onMount(el);
      }}
      aria-hidden="true"
      data-gt-overlay=""
      data-gt-scope=""
      data-gt-decor="off"
      data-gt-effect={state.effect}
      data-theme={state.theme ?? undefined}
      className={state.mode === "dark" ? "dark" : undefined}
      style={{ colorScheme: state.mode }}
    >
      <i data-gt-shape="" />
      {state.effect === "ekklesia" ? <MosaicTiles /> : null}
      <i data-gt-panel="a" />
      <i data-gt-panel="b" />
      {state.theme ? <ThemeEmblem theme={state.theme} animate="enter" /> : null}
    </div>,
    document.body,
  );
}

/** A grid of square tiles covering the screen, for Ekklesia's mosaic switch. */
function MosaicTiles() {
  const cols = innerWidth < 640 ? 8 : 14;
  const rows = Math.ceil((cols * innerHeight) / innerWidth);
  return (
    <div data-gt-tiles="" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
      {Array.from({ length: cols * rows }, (_, i) => (
        <i key={i} data-gt-tile="" />
      ))}
    </div>
  );
}
