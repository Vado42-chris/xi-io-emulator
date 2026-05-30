/** Merge class names (xi-io UI kit — no Tailwind dependency). */
export const cn = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(' ');
