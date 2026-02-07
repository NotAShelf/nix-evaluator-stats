export interface StatsData {
  cpuTime: number;
  time: {
    cpu: number;
    gc?: number;
    gcNonIncremental?: number;
    gcFraction?: number;
    gcNonIncrementalFraction?: number;
  };
  envs: {
    number: number;
    elements: number;
    bytes: number;
  };
  list: {
    elements: number;
    bytes: number;
    concats: number;
  };
  values: {
    number: number;
    bytes: number;
  };
  symbols: {
    number: number;
    bytes: number;
  };
  sets: {
    number: number;
    elements: number;
    bytes: number;
  };
  sizes: {
    Env: number;
    Value: number;
    Bindings: number;
    Attr: number;
  };
  nrExprs: number;
  nrThunks: number;
  nrAvoided: number;
  nrLookups: number;
  nrOpUpdates: number;
  nrOpUpdateValuesCopied: number;
  nrPrimOpCalls: number;
  nrFunctionCalls: number;
  gc?: {
    heapSize: number;
    totalBytes: number;
    cycles: number;
  };
  primops?: Record<string, number>;
  functions?: Array<{
    name: string | null;
    file: string;
    line: number;
    column: number;
    count: number;
  }>;
  attributes?: Array<{
    file: string;
    line: number;
    column: number;
    count: number;
  }>;
  narInfoRead?: number;
  narInfoReadAverted?: number;
  narInfoMissing?: number;
  narInfoWrite?: number;
  narRead?: number;
  narReadBytes?: number;
  narReadCompressedBytes?: number;
  narWrite?: number;
  narWriteAverted?: number;
  narWriteBytes?: number;
  narWriteCompressedBytes?: number;
}

export interface ComparisonEntry {
  id: number;
  name: string;
  data: StatsData;
  raw: Record<string, unknown>;
  timestamp: Date;
}
