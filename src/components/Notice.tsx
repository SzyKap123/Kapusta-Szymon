export function Notice({ kind = "info", children }: { kind?: "info" | "error" | "success"; children: React.ReactNode }) {
  const cls = {
    info: "border-line bg-surface-2 text-slate-200",
    error: "border-loss/50 bg-loss/10 text-red-200",
    success: "border-win/50 bg-win/10 text-green-200",
  }[kind];
  return <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

export function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
