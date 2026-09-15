export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  const value = n / 1000;
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}k`;
}
