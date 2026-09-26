import type { SVGProps } from "react";
import { LOGO_LETTERS, LOGO_SQUARE } from "./logo-paths";

/**
 * The goodthemes mark, traced from assets/logo.png (scripts/trace-logo.mjs). It wears the active
 * theme: the square in the primary color, the letters in the color that reads on it.
 */
export function Logo({ size = 28, ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" {...props}>
      <path d={LOGO_SQUARE} fill="var(--primary)" />
      <path d={LOGO_LETTERS} fill="var(--primary-foreground)" />
    </svg>
  );
}
