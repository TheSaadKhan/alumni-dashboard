// lib/time.ts
export function formatRelative(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(); // simple: you can replace with dayjs/Intl.RelativeTimeFormat
}
