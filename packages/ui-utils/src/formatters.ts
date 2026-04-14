export function formatBytes(bytes: number, precision = 2): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log2(bytes) / 10);
  return `${(bytes / (1 << (i * 10))).toFixed(precision)} ${units[i]}`;
}

export function formatNumber(num: number, precision = 2): string {
  if (num >= 1e9) return parseFloat((num / 1e9).toFixed(precision)).toString() + 'B';
  if (num >= 1e6) return parseFloat((num / 1e6).toFixed(precision)).toString() + 'M';
  if (num >= 1e3) return parseFloat((num / 1e3).toFixed(precision)).toString() + 'K';
  const factor = Math.pow(10, precision);
  return (Math.round(num * factor) / factor).toString();
}

export function formatTime(seconds: number, precision = 2): string {
  if (seconds < 0.001) return (seconds * 1e6).toFixed(precision) + 'μs';
  if (seconds < 1) return (seconds * 1000).toFixed(precision) + 'ms';
  return seconds.toFixed(3) + 's';
}

export function formatPercent(value: number, precision = 2): string {
  return (value * 100).toFixed(precision) + '%';
}
