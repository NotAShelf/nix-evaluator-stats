import { Component, For, createSignal, createMemo, Show } from 'solid-js';
import { ComparisonEntry } from '../utils/types';
import {
  formatBytes,
  formatNumber,
  formatTime,
  formatPercent,
  calculateChange,
} from '../utils/formatters';
import { ArrowRight, ArrowDown, ArrowUp, X } from 'lucide-solid';

interface ComparisonViewProps {
  entries: ComparisonEntry[];
  onSelect: (entry: ComparisonEntry) => void;
  onDelete: (id: number) => void;
}

const ComparisonView: Component<ComparisonViewProps> = props => {
  const [leftEntry, setLeftEntry] = createSignal<ComparisonEntry | null>(null);
  const [rightEntry, setRightEntry] = createSignal<ComparisonEntry | null>(null);

  const comparison = createMemo(() => {
    const left = leftEntry();
    const right = rightEntry();
    if (!left || !right) return null;

    const fields = [
      ['cpuTime', 'CPU Time', 'time'],
      ['envs.number', 'Env Count', 'number'],
      ['envs.bytes', 'Env Memory', 'bytes'],
      ['list.elements', 'List Elements', 'number'],
      ['list.concats', 'List Concat', 'number'],
      ['values.number', 'Value Count', 'number'],
      ['symbols.number', 'Symbol Count', 'number'],
      ['sets.number', 'Set Count', 'number'],
      ['sets.elements', 'Attributes', 'number'],
      ['nrExprs', 'Expressions', 'number'],
      ['nrThunks', 'Thunks', 'number'],
      ['nrAvoided', 'Thunks Avoided', 'number'],
      ['nrLookups', 'Lookups', 'number'],
      ['nrFunctionCalls', 'Function Calls', 'number'],
      ['nrPrimOpCalls', 'PrimOp Calls', 'number'],
    ].map(([key, label, format]) => ({
      key,
      label,
      format: format as 'number' | 'bytes' | 'time' | 'percent',
    }));

    return fields.map(field => {
      const getValue = (data: ComparisonEntry['data']) => {
        const keys = field.key.split('.');
        let value: unknown = data;
        for (const k of keys) value = value && (value as Record<string, unknown>)?.[k];
        return typeof value === 'number' ? value : 0;
      };

      const leftVal = getValue(left.data);
      const rightVal = getValue(right.data);
      const change = calculateChange(rightVal, leftVal);

      return {
        ...field,
        leftValue: leftVal,
        rightValue: rightVal,
        change: change.percent,
        isReduction: change.isReduction,
        isDifferent: leftVal !== rightVal,
      };
    });
  });

  const selectLeft = (e: Event) => {
    const id = parseInt((e.target as HTMLSelectElement).value);
    const entry = props.entries.find(en => en.id === id);
    setLeftEntry(entry || null);
  };

  const selectRight = (e: Event) => {
    const id = parseInt((e.target as HTMLSelectElement).value);
    const entry = props.entries.find(en => en.id === id);
    setRightEntry(entry || null);
  };

  return (
    <div class="comparison-view">
      <div class="comparison-controls">
        <div class="compare-selector">
          <label>Baseline</label>
          <select onChange={selectLeft} value={leftEntry()?.id || ''}>
            <option value="">Select snapshot...</option>
            <For each={props.entries}>
              {entry => <option value={entry.id}>{entry.name}</option>}
            </For>
          </select>
        </div>
        <div class="compare-arrow">
          <ArrowRight size={20} />
        </div>
        <div class="compare-selector">
          <label>Current</label>
          <select onChange={selectRight} value={rightEntry()?.id || ''}>
            <option value="">Select snapshot...</option>
            <For each={props.entries}>
              {entry => <option value={entry.id}>{entry.name}</option>}
            </For>
          </select>
        </div>
      </div>

      <Show when={props.entries.length > 0}>
        <div class="snapshots-list">
          <h4>Saved Snapshots</h4>
          <For each={props.entries}>
            {entry => (
              <div class="snapshot-item">
                <span class="snapshot-name">{entry.name}</span>
                <button class="delete-btn" onClick={() => props.onDelete(entry.id)}>
                  <X size={16} />
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>

      <Show
        when={leftEntry() && rightEntry()}
        fallback={<div class="compare-placeholder">Select two snapshots to compare metrics</div>}
      >
        <div class="comparison-table">
          <div class="compare-header">
            <div class="col-label">Metric</div>
            <div class="col-value">{leftEntry()?.name}</div>
            <div class="col-value">{rightEntry()?.name}</div>
            <div class="col-change">Change</div>
          </div>
          <For each={comparison()}>
            {row => (
              <div class={`compare-row ${row.isDifferent ? 'diff' : ''}`}>
                <div class="col-label" title={row.label}>
                  {row.label}
                </div>
                <div class="col-value">
                  {row.format === 'bytes'
                    ? formatBytes(row.leftValue)
                    : row.format === 'time'
                      ? formatTime(row.leftValue)
                      : row.format === 'percent'
                        ? formatPercent(row.leftValue)
                        : formatNumber(row.leftValue)}
                </div>
                <div class="col-value">
                  {row.format === 'bytes'
                    ? formatBytes(row.rightValue)
                    : row.format === 'time'
                      ? formatTime(row.rightValue)
                      : row.format === 'percent'
                        ? formatPercent(row.rightValue)
                        : formatNumber(row.rightValue)}
                </div>
                <div
                  class={`col-change ${row.isReduction ? 'good' : row.isDifferent ? 'bad' : ''}`}
                >
                  <Show when={row.isDifferent} fallback={<span class="neutral">—</span>}>
                    <span class="change-value">
                      <Show when={row.isReduction}>
                        <ArrowDown size={14} />
                      </Show>
                      <Show when={!row.isReduction}>
                        <ArrowUp size={14} />
                      </Show>
                      {Math.abs(row.change).toFixed(1)}%
                    </span>
                  </Show>
                </div>
              </div>
            )}
          </For>
        </div>

        <div class="comparison-summary">
          <Show when={comparison()?.some(r => r.isReduction)}>
            <div class="summary-good">
              <ArrowDown size={16} />{' '}
              {comparison()?.filter(r => r.isReduction && r.isDifferent).length} improved
            </div>
          </Show>
          <Show when={comparison()?.some(r => !r.isReduction && r.isDifferent)}>
            <div class="summary-bad">
              <ArrowUp size={16} />{' '}
              {comparison()?.filter(r => !r.isReduction && r.isDifferent).length} regressed
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
};

export default ComparisonView;
