import clsx from "clsx";

export function cn(...inputs: (string | boolean | undefined)[]) {
  return clsx(inputs);
}

export function pnlColor(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-red-400";
  return "text-zinc-400";
}

export function pnlBg(value: number): string {
  if (value > 0) return "bg-emerald-500/10 text-emerald-400";
  if (value < 0) return "bg-red-500/10 text-red-400";
  return "bg-zinc-500/10 text-zinc-400";
}
