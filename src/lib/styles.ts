/**
 * Central registry for common Tailwind class clusters.
 * Use these constants to keep styling consistent and DRY.
 */

export const TYPOGRAPHY = {
  TITLE: "text-xl font-semibold tracking-tight",
  TITLE_LG: "text-2xl font-semibold tracking-tight",
  DESCRIPTION_SM: "text-sm text-muted-foreground",
  DESCRIPTION_BASE: "text-base text-muted-foreground",
  MONO_SM: "font-mono text-sm",
  MONO_SM_MUTED: "font-mono text-sm text-muted-foreground",
  LABEL: "text-sm font-medium",
  LABEL_MUTED: "text-sm font-medium text-muted-foreground",
}

export const LAYOUT = {
  FLEX_BETWEEN: "flex items-center justify-between",
  FLEX_CENTER: "flex items-center justify-center",
  FLEX_START: "flex items-center",
  FLEX_END: "flex items-center justify-end",
  SECTION_SPACING: "space-y-4",
  PAGE_WIDTH: "mx-auto max-w-6xl",
  BACKDROP_CARD: "border-border/50 bg-background/50 backdrop-blur-sm",
}
