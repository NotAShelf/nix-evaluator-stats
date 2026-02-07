export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log2(bytes) / 10);
  return `${(bytes / (1 << (i * 10))).toFixed(2)} ${units[i]}`;
}

export function formatNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toString();
}

export function formatTime(seconds: number): string {
  if (seconds < 0.001) return (seconds * 1e6).toFixed(2) + 'μs';
  if (seconds < 1) return (seconds * 1000).toFixed(2) + 'ms';
  return seconds.toFixed(3) + 's';
}

export function formatPercent(value: number): string {
  return (value * 100).toFixed(2) + '%';
}
