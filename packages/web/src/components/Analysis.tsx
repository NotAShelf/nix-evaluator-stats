import { Component, For, Show, createMemo } from 'solid-js';
import { StatsData } from '@ns/core';
import { formatBytes, formatNumber, formatTime } from '@ns/ui-utils';
import MetricCard from './MetricCard';
import Section from './Section';
import MemoryChart from './MemoryChart';
import TimeChart from './TimeChart';
import OperationsChart from './OperationsChart';
import ThunkChart from './ThunkChart';

const TOOLTIPS = {
  cpuTime: 'Total CPU user time in seconds spent on Nix expression evaluation',
  memory: 'Combined memory for all evaluation structures (envs, lists, values, symbols, sets)',
  nrExprs: 'Total number of Nix expressions parsed and created during evaluation',
  nrThunks:
    "Number of thunks (delayed computations) created during evaluation. A thunk is created when a value is needed but hasn't been computed yet.",
  nrAvoided:
    'Number of thunks avoided by value reuse. When a value is already computed, forcing a thunk reuses it instead of creating a new computation.',
  nrLookups: 'Number of attribute lookups performed (e.g., accessing .attr from an attribute set)',
  nrPrimOpCalls: 'Total number of builtin function (primop) calls like map, foldl, concatMap, etc.',
  nrFunctionCalls: 'Total number of user-defined function calls executed',
  nrOpUpdates: 'Number of attribute set update operations performed (the // operator)',
  nrOpUpdateValuesCopied: 'Number of values copied during attribute set updates',
  envsNumber:
    'Total number of lexical environments created during evaluation. Environments bind variables to values.',
  envsElements: 'Total number of values stored in all environment slots across all environments',
  envsBytes: 'Memory for environments = nrEnvs * sizeof(Env) + nrValuesInEnvs * sizeof(Value*)',
  listElements: 'Total number of list elements ([ ... ]) allocated across all lists',
  listBytes: 'Memory for list elements = nrListElems * sizeof(Value*) (pointer per element)',
  listConcats: 'Number of list concatenation operations (++) performed during evaluation',
  valuesNumber: 'Total number of Value objects allocated during evaluation',
  valuesBytes: 'Memory for values = nrValues * sizeof(Value)',
  symbolsNumber: 'Total number of unique symbols interned in the symbol table',
  symbolsBytes: 'Total memory used by all symbol strings in the symbol table',
  setsNumber: 'Total number of attribute sets ({ ... }) created during evaluation',
  setsElements: 'Total number of attributes (key-value pairs) across all attribute sets',
  setsBytes:
    'Memory for attribute sets = nrAttrsets * sizeof(Bindings) + nrAttrsInAttrsets * sizeof(Attr)',
  narRead: 'Number of NAR (Nix Archive) files read from the Nix store',
  narWrite: 'Number of NAR (Nix Archive) files written to the Nix store',
  narReadBytes: 'Total uncompressed bytes read from NAR archives',
  narWriteBytes: 'Total uncompressed bytes written to NAR archives',
  gcHeapSize: 'Current size of the garbage collected heap in bytes',
  gcTotalBytes: 'Total number of bytes allocated since program start',
  gcCycles: 'Total number of garbage collection cycles performed',
  attrSelect: 'Number of attribute selections performed (accessing .attr from an attribute set)',
};

const Analysis: Component<{ stats: StatsData }> = props => {
  const totalMemory = createMemo(
    () =>
      props.stats.envs.bytes +
      props.stats.list.bytes +
      props.stats.values.bytes +
      props.stats.symbols.bytes +
      props.stats.sets.bytes,
  );

  const memoryBreakdown = createMemo(() =>
    [
      { label: 'Envs', value: props.stats.envs.bytes, total: totalMemory(), colorClass: 'chart-1' },
      {
        label: 'Lists',
        value: props.stats.list.bytes,
        total: totalMemory(),
        colorClass: 'chart-2',
      },
      {
        label: 'Values',
        value: props.stats.values.bytes,
        total: totalMemory(),
        colorClass: 'chart-3',
      },
      {
        label: 'Symbols',
        value: props.stats.symbols.bytes,
        total: totalMemory(),
        colorClass: 'chart-4',
      },
      { label: 'Sets', value: props.stats.sets.bytes, total: totalMemory(), colorClass: 'chart-5' },
    ].sort((a, b) => b.value - a.value),
  );

  const topPrimops = createMemo(() => {
    if (!props.stats.primops) return [];
    return Object.entries(props.stats.primops)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  });

  const topFunctions = createMemo(() => {
    if (!props.stats.functions) return [];
    return [...props.stats.functions].sort((a, b) => b.count - a.count).slice(0, 10);
  });

  const topAttributes = createMemo(() => {
    if (!props.stats.attributes) return [];
    return [...props.stats.attributes].sort((a, b) => b.count - a.count).slice(0, 10);
  });

  return (
    <div class="analysis">
      <div class="analysis-header">
        <div class="header-stats">
          <MetricCard
            label="CPU Time"
            value={formatTime(props.stats.cpuTime)}
            tooltip={TOOLTIPS.cpuTime}
          />
          <MetricCard label="Memory" value={formatBytes(totalMemory())} tooltip={TOOLTIPS.memory} />
          <MetricCard
            label="Expressions"
            value={formatNumber(props.stats.nrExprs)}
            tooltip={TOOLTIPS.nrExprs}
          />
          <MetricCard
            label="Thunks"
            value={`${formatNumber(props.stats.nrAvoided)} / ${formatNumber(props.stats.nrThunks)}`}
            tooltip="Avoided / Created thunks. Avoided means the value was already computed and reused."
            highlight={props.stats.nrAvoided >= props.stats.nrThunks}
          />
        </div>
      </div>

      <div class="charts-grid">
        <Section title="Memory Distribution" collapsible>
          <MemoryChart data={memoryBreakdown()} />
          <Show when={props.stats.gc}>
            <div class="gc-inline">
              <div class="gc-header">GC Statistics</div>
              <div class="gc-values">
                <span class="gc-label">Heap:</span>
                <span class="gc-value">{formatBytes(props.stats.gc?.heapSize || 0)}</span>
                <span class="gc-label">Allocated:</span>
                <span class="gc-value">{formatBytes(props.stats.gc?.totalBytes || 0)}</span>
                <span class="gc-label">Cycles:</span>
                <span class="gc-value">{formatNumber(props.stats.gc?.cycles || 0)}</span>
              </div>
            </div>
          </Show>
        </Section>

        <Section title="Time & Thunks" collapsible>
          <div class="time-thunks-combined">
            <TimeChart stats={props.stats} />
            <div class="thunks-section">
              <ThunkChart stats={props.stats} />
            </div>
          </div>
        </Section>

        <Section title="Operations" collapsible>
          <OperationsChart stats={props.stats} />
        </Section>
      </div>

      <div class="dashboard-grid">
        <Section title="Environments" collapsible>
          <div class="metrics-grid small">
            <MetricCard
              label="Count"
              value={formatNumber(props.stats.envs.number)}
              tooltip={TOOLTIPS.envsNumber}
            />
            <MetricCard
              label="Elements"
              value={formatNumber(props.stats.envs.elements)}
              tooltip={TOOLTIPS.envsElements}
            />
            <MetricCard
              label="Memory"
              value={formatBytes(props.stats.envs.bytes)}
              tooltip={TOOLTIPS.envsBytes}
            />
          </div>
        </Section>

        <Section title="Values & Symbols" collapsible>
          <div class="metrics-grid small">
            <MetricCard
              label="Values"
              value={formatNumber(props.stats.values.number)}
              tooltip={TOOLTIPS.valuesNumber}
            />
            <MetricCard
              label="Value Bytes"
              value={formatBytes(props.stats.values.bytes)}
              tooltip={TOOLTIPS.valuesBytes}
            />
            <MetricCard
              label="Symbols"
              value={formatNumber(props.stats.symbols.number)}
              tooltip={TOOLTIPS.symbolsNumber}
            />
            <MetricCard
              label="Symbol Bytes"
              value={formatBytes(props.stats.symbols.bytes)}
              tooltip={TOOLTIPS.symbolsBytes}
            />
          </div>
        </Section>

        <Section title="Lists & Sets" collapsible>
          <div class="metrics-grid small">
            <MetricCard
              label="List Elements"
              value={formatNumber(props.stats.list.elements)}
              tooltip={TOOLTIPS.listElements}
            />
            <MetricCard
              label="Concat Ops"
              value={formatNumber(props.stats.list.concats)}
              tooltip={TOOLTIPS.listConcats}
            />
            <MetricCard
              label="Set Count"
              value={formatNumber(props.stats.sets.number)}
              tooltip={TOOLTIPS.setsNumber}
            />
            <MetricCard
              label="Attributes"
              value={formatNumber(props.stats.sets.elements)}
              tooltip={TOOLTIPS.setsElements}
            />
          </div>
        </Section>
      </div>

      <Show when={topPrimops().length > 0}>
        <Section title="Top Primitive Operations" collapsible>
          <div class="top-list">
            <For each={topPrimops()}>
              {(item, i) => (
                <div class="top-item">
                  <span class="rank">{i() + 1}</span>
                  <span class="name">{item.name}</span>
                  <span class="count">{formatNumber(item.count)}</span>
                </div>
              )}
            </For>
          </div>
        </Section>
      </Show>

      <Show when={topFunctions().length > 0}>
        <Section title="Top Function Calls" collapsible>
          <div class="top-list">
            <For each={topFunctions()}>
              {(item, i) => (
                <div class="top-item">
                  <span class="rank">{i() + 1}</span>
                  <span class="name">{item.name || '<lambda>'}</span>
                  <span class="count">{formatNumber(item.count)}</span>
                  <span class="location">
                    {item.file}:{item.line}
                  </span>
                </div>
              )}
            </For>
          </div>
        </Section>
      </Show>

      <Show when={props.stats.narRead !== undefined}>
        <Section title="Store I/O" collapsible>
          <div class="metrics-grid small">
            <MetricCard
              label="NAR Reads"
              value={formatNumber(props.stats.narRead || 0)}
              tooltip={TOOLTIPS.narRead}
            />
            <MetricCard
              label="NAR Writes"
              value={formatNumber(props.stats.narWrite || 0)}
              tooltip={TOOLTIPS.narWrite}
            />
            <MetricCard
              label="Read Bytes"
              value={formatBytes(props.stats.narReadBytes || 0)}
              tooltip={TOOLTIPS.narReadBytes}
            />
            <MetricCard
              label="Write Bytes"
              value={formatBytes(props.stats.narWriteBytes || 0)}
              tooltip={TOOLTIPS.narWriteBytes}
            />
          </div>
        </Section>
      </Show>

      <Show when={topAttributes().length > 0}>
        <Section title="Top Attribute Selections" collapsible>
          <div class="top-list">
            <For each={topAttributes()}>
              {(item, i) => (
                <div class="top-item">
                  <span class="rank">{i() + 1}</span>
                  <span class="location">
                    {item.file}:{item.line}
                  </span>
                  <span class="count">{formatNumber(item.count)}</span>
                </div>
              )}
            </For>
          </div>
        </Section>
      </Show>
    </div>
  );
};

export default Analysis;
