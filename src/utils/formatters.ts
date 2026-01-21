import { StatsData } from './types';

const num = (val: unknown): number => (typeof val === 'number' ? val : 0);

export function parseStats(json: Record<string, unknown>): StatsData {
  const timeObj = json.time as Record<string, unknown> | undefined;
  const envsObj = json.envs as Record<string, unknown> | undefined;
  const listObj = json.list as Record<string, unknown> | undefined;
  const valuesObj = json.values as Record<string, unknown> | undefined;
  const symbolsObj = json.symbols as Record<string, unknown> | undefined;
  const setsObj = json.sets as Record<string, unknown> | undefined;
  const sizesObj = json.sizes as Record<string, unknown> | undefined;

  const stats: StatsData = {
    cpuTime: num(json.cpuTime),
    time: {
      cpu: num(timeObj?.cpu) || num(json.cpuTime),
      gc: num(timeObj?.gc),
      gcNonIncremental: num(timeObj?.gcNonIncremental),
      gcFraction: num(timeObj?.gcFraction),
      gcNonIncrementalFraction: num(timeObj?.gcNonIncrementalFraction),
    },
    envs: {
      number: num(envsObj?.number),
      elements: num(envsObj?.elements),
      bytes: num(envsObj?.bytes),
    },
    list: {
      elements: num(listObj?.elements),
      bytes: num(listObj?.bytes),
      concats: num(listObj?.concats),
    },
    values: { number: num(valuesObj?.number), bytes: num(valuesObj?.bytes) },
    symbols: { number: num(symbolsObj?.number), bytes: num(symbolsObj?.bytes) },
    sets: {
      number: num(setsObj?.number),
      elements: num(setsObj?.elements),
      bytes: num(setsObj?.bytes),
    },
    sizes: {
      Env: num(sizesObj?.Env),
      Value: num(sizesObj?.Value),
      Bindings: num(sizesObj?.Bindings),
      Attr: num(sizesObj?.Attr),
    },
    nrExprs: num(json.nrExprs),
    nrThunks: num(json.nrThunks),
    nrAvoided: num(json.nrAvoided),
    nrLookups: num(json.nrLookups),
    nrOpUpdates: num(json.nrOpUpdates),
    nrOpUpdateValuesCopied: num(json.nrOpUpdateValuesCopied),
    nrPrimOpCalls: num(json.nrPrimOpCalls),
    nrFunctionCalls: num(json.nrFunctionCalls),
  };

  if (json.gc && typeof json.gc === 'object') {
    const gc = json.gc as Record<string, unknown>;
    stats.gc = {
      heapSize: num(gc.heapSize),
      totalBytes: num(gc.totalBytes),
      cycles: num(gc.cycles),
    };
  }

  if (json.primops && typeof json.primops === 'object')
    stats.primops = json.primops as Record<string, number>;
  if (json.functions && Array.isArray(json.functions))
    stats.functions = json.functions as StatsData['functions'];
  if (json.attributes && Array.isArray(json.attributes))
    stats.attributes = json.attributes as StatsData['attributes'];

  const storeFields = [
    'narInfoRead',
    'narInfoReadAverted',
    'narInfoMissing',
    'narInfoWrite',
    'narRead',
    'narReadBytes',
    'narReadCompressedBytes',
    'narWrite',
    'narWriteAverted',
    'narWriteBytes',
    'narWriteCompressedBytes',
  ] as const;

  for (const field of storeFields) {
    if (typeof json[field] === 'number')
      (stats as unknown as Record<string, number>)[field] = json[field] as number;
  }

  return stats;
}

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

export function calculateChange(
  current: number,
  previous: number,
): { value: number; percent: number; isReduction: boolean } {
  if (previous === 0) {
    const percent = current === 0 ? 0 : 100;
    return { value: current, percent, isReduction: false };
  }
  const value = current - previous;
  const percent = (value / previous) * 100;
  return { value, percent, isReduction: value < 0 };
}
