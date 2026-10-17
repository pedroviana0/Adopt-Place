import type { IndicatorGroup, Tone } from "@/lib/dashboard-visual";

// Spec 011 (ui-contracts §4): único lugar com nomes de classe de cor do painel.
// Classes escritas por extenso: o Tailwind v4 só gera o CSS de classes que
// encontra inteiras no código-fonte; `bg-${tom}` passaria no tsc e sairia sem cor.

export const toneChipClass: Record<Tone, string> = {
  primary: "bg-primary-muted text-primary-muted-foreground",
  neutral: "bg-muted text-muted-foreground",
  accent: "bg-accent text-accent-foreground",
  destructive: "bg-destructive-muted text-destructive-muted-foreground",
  warning: "bg-warning-muted text-warning-muted-foreground",
  information: "bg-information-muted text-information-muted-foreground",
  success: "bg-success-muted text-success-muted-foreground",
};

// Borda de "Requer ação" (C4): só os três tons que a usam.
export const toneBorderClass: Partial<Record<Tone, string>> = {
  primary: "border-primary",
  destructive: "border-destructive",
  success: "border-success",
};

// Preenchimento de barra e de bolinha de legenda (C6, C7).
export const toneFillClass: Partial<Record<Tone, string>> = {
  primary: "bg-primary",
  neutral: "bg-muted-foreground",
  accent: "bg-chart-2",
  success: "bg-success",
};

export const groupIconClass: Record<IndicatorGroup["tone"], string> = {
  primary: "text-primary",
  information: "text-information",
  brand: "text-brand",
};
