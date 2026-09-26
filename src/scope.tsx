import { useEffect, type ComponentProps } from "react";
import { useOptionalTheme } from "./context";
import { ensureFonts } from "./fonts";
import type { ResolvedMode, ThemeName } from "./themes";

export interface ThemeScopeProps extends ComponentProps<"div"> {
  theme: ThemeName;
  /** Defaults to the page's current mode (or light, outside a provider). */
  mode?: ResolvedMode;
  /** Texture, display headings and component touches inside the scope. */
  decor?: boolean;
  /** Load the theme's Google Fonts stylesheet. */
  fonts?: boolean;
}

/**
 * Applies a theme to one part of the page, e.g. a preview card in a theme picker.
 * Everything inside it resolves the theme's tokens and touches; nothing outside does.
 */
export function ThemeScope({ theme, mode, decor = true, fonts = true, className, ...props }: ThemeScopeProps) {
  const page = useOptionalTheme();
  const resolved = mode ?? page?.resolvedMode ?? "light";

  useEffect(() => {
    if (fonts) ensureFonts(theme);
  }, [fonts, theme]);

  return (
    <div
      data-gt-scope=""
      data-theme={theme}
      data-gt-decor={decor ? undefined : "off"}
      className={[resolved === "dark" ? "dark" : undefined, className].filter(Boolean).join(" ")}
      style={{ colorScheme: resolved, ...props.style }}
      {...props}
    />
  );
}
