import { Component, For, createSignal, createMemo, Show, onMount, onCleanup } from 'solid-js';
import { ComparisonEntry, calculateChange, StatsData } from '@ns/core';
import { formatBytes, formatNumber, formatTime, formatPercent } from '@ns/ui-utils';
import ArrowRightIcon from 'lucide-solid/icons/arrow-right';
import ArrowDownIcon from 'lucide-solid/icons/arrow-down';
import ArrowUpIcon from 'lucide-solid/icons/arrow-up';
import XIcon from 'lucide-solid/icons/x';
import ShareIcon from 'lucide-solid/icons/share';
import FileUpload from './FileUpload';

interface ComparisonViewProps {
  entries: ComparisonEntry[];
  onSelect: (entry: ComparisonEntry) => void;
  onDelete: (id: number) => void;
  precision?: number;
  pasteMode: 'advance' | 'replace';
  onPasteModeChange: (mode: 'advance' | 'replace') => void;
  onPasteStats: (text: string, name: string) => ComparisonEntry | null;
  onFileLoad: (data: StatsData, raw: Record<string, unknown>) => void;
  onTextLoad: (text: string) => void;
  onGenerateShareUrl: (left: ComparisonEntry, right: ComparisonEntry) => void;
  initialLeftId?: number | null;
  initialRightId?: number | null;
  onInitialSelectionUsed?: () => void;
}

const ComparisonView: Component<ComparisonViewProps> = props => {
  const prec = () => props.precision ?? 2;
  const [leftEntry, setLeftEntry] = createSignal<ComparisonEntry | null>(null);
  const [rightEntry, setRightEntry] = createSignal<ComparisonEntry | null>(null);
  const [showPasteModal, setShowPasteModal] = createSignal(false);
  const [pasteError, setPasteError] = createSignal('');
  const [pasteName, setPasteName] = createSignal('');
  const [pendingPasteText, setPendingPasteText] = createSignal('');

  const handlePaste = (e: ClipboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }
    const text = e.clipboardData?.getData('text');
    if (!text) return;
    try {
      JSON.parse(text);
      setPendingPasteText(text);
      setPasteName(`Snapshot ${props.entries.length + 1}`);
      setShowPasteModal(true);
    } catch {
      // Silently ignore invalid JSON on paste
    }
  };

  onMount(() => {
    document.addEventListener('paste', handlePaste);

    if (props.initialLeftId !== null && props.initialLeftId !== undefined) {
      const left = props.entries.find(e => e.id === props.initialLeftId);
      if (left) {
        setLeftEntry(left);
      }
    }
    if (props.initialRightId !== null && props.initialRightId !== undefined) {
      const right = props.entries.find(e => e.id === props.initialRightId);
      if (right) {
        setRightEntry(right);
      }
    }
    if (props.initialLeftId != null || props.initialRightId != null) {
      props.onInitialSelectionUsed?.();
    }
  });

  onCleanup(() => {
    document.removeEventListener('paste', handlePaste);
  });

  const confirmPaste = () => {
    const entry = props.onPasteStats(pendingPasteText(), pasteName());
    if (!entry) {
      setPasteError('Failed to process pasted statistics');
      return;
    }
    if (props.pasteMode === 'advance') {
      if (rightEntry()) {
        setLeftEntry(rightEntry());
      }
      setRightEntry(entry);
    } else {
      setRightEntry(entry);
    }
    setShowPasteModal(false);
    setPasteError('');
  };

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
      const getValue = (
        data: ComparisonEntry['data'],
        raw: Record<string, unknown>,
      ): { value: number; present: boolean } => {
        const keys = field.key.split('.');
        let value: unknown = data;
        for (const k of keys) value = value && (value as Record<string, unknown>)?.[k];

        let present = typeof value === 'number';
        if (!present) {
          present =
            keys.reduce((obj: unknown, k: string) => {
              if (obj && typeof obj === 'object' && k in (obj as Record<string, unknown>)) {
                const nested = (obj as Record<string, unknown>)[k];
                return typeof nested === 'object' && nested !== null ? nested : true;
              }
              return undefined;
            }, raw as unknown) !== undefined;
        }

        return { value: typeof value === 'number' ? value : 0, present };
      };

      const leftVal = getValue(left.data, left.raw);
      const rightVal = getValue(right.data, right.raw);
      const change = calculateChange(rightVal.value, leftVal.value);
      const isMissing = !leftVal.present || !rightVal.present;

      return {
        ...field,
        leftValue: leftVal.value,
        rightValue: rightVal.value,
        change: change.percent,
        isReduction: change.isReduction,
        isDifferent: leftVal.value !== rightVal.value,
        isMissing,
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
      <Show when={props.entries.length >= 2}>
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
            <ArrowRightIcon size={20} />
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
          <div class="compare-paste-toggle">
            <button
              class={props.pasteMode === 'advance' ? 'active' : ''}
              onClick={() => props.onPasteModeChange('advance')}
              title="Paste shifts current to baseline"
            >
              Auto
            </button>
            <button
              class={props.pasteMode === 'replace' ? 'active' : ''}
              onClick={() => props.onPasteModeChange('replace')}
              title="Paste replaces current only"
            >
              Replace
            </button>
          </div>
          <Show when={leftEntry() && rightEntry()}>
            <button
              class="share-btn"
              onClick={() => props.onGenerateShareUrl(leftEntry()!, rightEntry()!)}
              title="Copy share URL to clipboard"
            >
              <ShareIcon size={16} />
              Share
            </button>
          </Show>
        </div>
      </Show>

      <Show when={props.entries.length > 0}>
        <div class="snapshots-list">
          <h4>Saved Snapshots</h4>
          <For each={props.entries}>
            {entry => (
              <div class="snapshot-item">
                <span class="snapshot-name">{entry.name}</span>
                <button class="delete-btn" onClick={() => props.onDelete(entry.id)}>
                  <XIcon size={16} />
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>

      <Show
        when={props.entries.length >= 2}
        fallback={
          <div class="compare-upload-section">
            <FileUpload
              onFileLoad={props.onFileLoad}
              onTextLoad={props.onTextLoad}
              snapshots={props.entries}
              onLoadSnapshot={props.onSelect}
            />
            <Show when={props.entries.length === 1}>
              <div class="compare-more-needed">
                <div class="compare-placeholder-hint">
                  Upload or paste one more snapshot to start comparing
                </div>
              </div>
            </Show>
          </div>
        }
      >
        <Show
          when={leftEntry() && rightEntry()}
          fallback={
            <div class="compare-placeholder">
              <div>Select two snapshots to compare metrics</div>
              <div class="compare-placeholder-hint">
                Paste JSON stats here (Ctrl+V) while in compare mode
              </div>
            </div>
          }
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
                <div
                  class={`compare-row ${row.isDifferent ? 'diff' : ''} ${row.isMissing ? 'missing' : ''}`}
                >
                  <div class="col-label" title={row.label}>
                    {row.label}
                  </div>
                  <div class="col-value">
                    <Show
                      when={row.isMissing}
                      fallback={
                        row.format === 'bytes'
                          ? formatBytes(row.leftValue, prec())
                          : row.format === 'time'
                            ? formatTime(row.leftValue, prec())
                            : row.format === 'percent'
                              ? formatPercent(row.leftValue, prec())
                              : formatNumber(row.leftValue, prec())
                      }
                    >
                      <span class="missing-value">N/A</span>
                    </Show>
                  </div>
                  <div class="col-value">
                    <Show
                      when={row.isMissing}
                      fallback={
                        row.format === 'bytes'
                          ? formatBytes(row.rightValue, prec())
                          : row.format === 'time'
                            ? formatTime(row.rightValue, prec())
                            : row.format === 'percent'
                              ? formatPercent(row.rightValue, prec())
                              : formatNumber(row.rightValue, prec())
                      }
                    >
                      <span class="missing-value">N/A</span>
                    </Show>
                  </div>
                  <div
                    class={`col-change ${row.isReduction ? 'good' : row.isDifferent && !row.isMissing ? 'bad' : ''}`}
                  >
                    <Show
                      when={row.isMissing}
                      fallback={
                        <Show when={row.isDifferent} fallback={<span class="neutral">—</span>}>
                          <span class="change-value">
                            <Show when={row.isReduction}>
                              <ArrowDownIcon size={14} />
                            </Show>
                            <Show when={!row.isReduction}>
                              <ArrowUpIcon size={14} />
                            </Show>
                            {parseFloat(
                              (
                                Math.round(Math.abs(row.change) * Math.pow(10, prec())) /
                                Math.pow(10, prec())
                              ).toFixed(prec()),
                            )}
                            %
                          </span>
                        </Show>
                      }
                    >
                      <span
                        class="missing-indicator"
                        title="Field not available in one or both implementations"
                      >
                        N/A
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
                <ArrowDownIcon size={16} />{' '}
                {comparison()?.filter(r => r.isReduction && r.isDifferent).length} improved
              </div>
            </Show>
            <Show when={comparison()?.some(r => !r.isReduction && r.isDifferent)}>
              <div class="summary-bad">
                <ArrowUpIcon size={16} />{' '}
                {comparison()?.filter(r => !r.isReduction && r.isDifferent).length} regressed
              </div>
            </Show>
          </div>
        </Show>
      </Show>

      <Show when={showPasteModal()}>
        <div
          class="modal-overlay"
          onClick={() => {
            setShowPasteModal(false);
            setPasteError('');
          }}
        >
          <div class="modal" onClick={e => e.stopPropagation()}>
            <div class="modal-header">
              <h3>Paste Statistics</h3>
              <button
                class="close-btn"
                onClick={() => {
                  setShowPasteModal(false);
                  setPasteError('');
                }}
              >
                <XIcon size={20} />
              </button>
            </div>
            <input
              type="text"
              class="snapshot-name-input"
              placeholder="Enter snapshot name..."
              value={pasteName()}
              onInput={e => setPasteName(e.currentTarget.value)}
              onKeyDown={e => e.key === 'Enter' && confirmPaste()}
              autofocus
            />
            <Show when={pasteError()}>
              <div class="error">{pasteError()}</div>
            </Show>
            <div class="modal-actions">
              <button
                class="cancel-btn"
                onClick={() => {
                  setShowPasteModal(false);
                  setPasteError('');
                }}
              >
                Cancel
              </button>
              <button class="confirm-btn" onClick={confirmPaste}>
                {props.entries.length >= 2 ? 'Save & Compare' : 'Save Snapshot'}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default ComparisonView;
