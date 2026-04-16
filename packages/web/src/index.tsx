import { createSignal, Show, For, onMount, createEffect, lazy } from 'solid-js';
import { render } from 'solid-js/web';
import LZUTF8 from 'lzutf8';
import SaveIcon from 'lucide-solid/icons/save';
import UploadIcon from 'lucide-solid/icons/upload';
import Trash2Icon from 'lucide-solid/icons/trash-2';
import XIcon from 'lucide-solid/icons/x';
import ShareIcon from 'lucide-solid/icons/link-2';
import FileUpload from './components/FileUpload';
import { StatsData, ComparisonEntry, parseStats } from '@ns/core';
import './styles.css';

type ShareState =
  | { type: 'analysis'; data: Record<string, unknown>; name: string }
  | {
      type: 'compare';
      left: Record<string, unknown>;
      right: Record<string, unknown>;
      leftName: string;
      rightName: string;
    };

function encodeShareUrl(state: ShareState): string {
  const json = JSON.stringify(state);
  const encoded = LZUTF8.compress(json, { outputEncoding: 'Base64' }) as string;
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function decodeShareUrl(encoded: string): ShareState | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const json = LZUTF8.decompress(base64, {
      inputEncoding: 'Base64',
      outputEncoding: 'String',
    }) as string | null;
    if (!json) {
      return null;
    }
    const state = JSON.parse(json) as ShareState;
    if (state.type === 'analysis') {
      if (!state.data || !state.name) {
        return null;
      }
    } else if (state.type === 'compare') {
      if (!state.left || !state.right || !state.leftName || !state.rightName) {
        return null;
      }
    } else {
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

const Analysis = lazy(() => import('./components/Analysis'));
const ComparisonView = lazy(() => import('./components/ComparisonView'));

function App() {
  const [currentStats, setCurrentStats] = createSignal<StatsData | null>(null);
  const [currentRaw, setCurrentRaw] = createSignal<Record<string, unknown> | null>(null);
  const [snapshots, setSnapshots] = createSignal<ComparisonEntry[]>([]);
  const [view, setView] = createSignal<'analysis' | 'compare'>('analysis');
  const [snapshotName, setSnapshotName] = createSignal('');
  const [showSaveDialog, setShowSaveDialog] = createSignal(false);
  const [showManageSnapshots, setShowManageSnapshots] = createSignal(false);
  const [precision, setPrecision] = createSignal(2);
  const [pasteMode, setPasteMode] = createSignal<'advance' | 'replace'>('advance');
  const [isLoading, setIsLoading] = createSignal(true);
  const [showOverrideModal, setShowOverrideModal] = createSignal(false);
  const [pendingOverrideText, setPendingOverrideText] = createSignal('');
  const [showShareToast, setShowShareToast] = createSignal(false);
  const [initialLeftId, setInitialLeftId] = createSignal<number | null>(null);
  const [initialRightId, setInitialRightId] = createSignal<number | null>(null);

  const STORAGE_KEY = 'ns-data';

  // Load from localStorage on mount
  onMount(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.snapshots)) {
          setSnapshots(
            parsed.snapshots.map((s: ComparisonEntry) => ({
              ...s,
              raw: s.raw || {},
            })),
          );
        }
        if (parsed.currentStats) {
          setCurrentStats(parsed.currentStats);
        }
        if (parsed.currentRaw) {
          setCurrentRaw(parsed.currentRaw);
        }
        if (parsed.view) {
          setView(parsed.view);
        }
        if (typeof parsed.precision === 'number' && parsed.precision >= 0) {
          setPrecision(parsed.precision);
        }
        if (parsed.pasteMode === 'advance' || parsed.pasteMode === 'replace') {
          setPasteMode(parsed.pasteMode);
        }
      }
    } catch (e) {
      console.warn('Failed to load saved data:', e);
    }

    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get('share');
    if (shareParam) {
      const shareState = decodeShareUrl(shareParam);
      if (shareState) {
        try {
          if (shareState.type === 'analysis') {
            const data = parseStats(shareState.data);
            setCurrentStats(data);
            setCurrentRaw(shareState.data);
            setSnapshotName(shareState.name);
            setView('analysis');
            window.history.replaceState({}, '', window.location.pathname);
          } else if (shareState.type === 'compare') {
            const leftData = parseStats(shareState.left);
            const rightData = parseStats(shareState.right);
            const leftId = Date.now();
            const rightId = Date.now() + 1;
            const leftEntry: ComparisonEntry = {
              id: leftId,
              name: shareState.leftName,
              data: leftData,
              raw: shareState.left,
              timestamp: new Date(),
            };
            const rightEntry: ComparisonEntry = {
              id: rightId,
              name: shareState.rightName,
              data: rightData,
              raw: shareState.right,
              timestamp: new Date(),
            };
            setSnapshots([leftEntry, rightEntry]);
            setInitialLeftId(leftId);
            setInitialRightId(rightId);
            setView('compare');
            window.history.replaceState({}, '', window.location.pathname);
          }
        } catch (e) {
          console.warn('Failed to load shared data:', e);
        }
      }
    }

    setIsLoading(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSaveDialog()) setShowSaveDialog(false);
        if (showManageSnapshots()) setShowManageSnapshots(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const handleAnalysisPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      const text = e.clipboardData?.getData('text');
      if (!text) return;
      try {
        JSON.parse(text);
      } catch {
        return;
      }
      if (view() === 'analysis' && currentStats()) {
        setPendingOverrideText(text);
        setShowOverrideModal(true);
      }
    };
    document.addEventListener('paste', handleAnalysisPaste);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('paste', handleAnalysisPaste);
    };
  });

  // Debounced save to localStorage
  const saveToStorage = debounce(
    (
      stats: StatsData | null,
      raw: Record<string, unknown> | null,
      snaps: ComparisonEntry[],
      v: 'analysis' | 'compare',
      prec: number,
      pm: 'advance' | 'replace',
    ) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            snapshots: snaps,
            currentStats: stats,
            currentRaw: raw,
            view: v,
            precision: prec,
            pasteMode: pm,
          }),
        );
      } catch (e) {
        console.warn('Failed to save data:', e);
      }
    },
    500,
  );

  // Save to localStorage on any change
  createEffect(() => {
    const stats = currentStats();
    const raw = currentRaw();
    const snaps = snapshots();
    const v = view();
    const prec = precision();
    const pm = pasteMode();

    if (isLoading()) return;

    saveToStorage(stats, raw, snaps, v, prec, pm);
  });

  const saveSnapshot = () => {
    const stats = currentStats();
    const raw = currentRaw();
    if (!stats || !raw) return;
    const name = snapshotName().trim() || `Snapshot ${snapshots().length + 1}`;
    const entry: ComparisonEntry = {
      id: Date.now(),
      name,
      data: stats,
      raw,
      timestamp: new Date(),
    };
    setSnapshots(prev => [...prev, entry]);
    setSnapshotName('');
    setShowSaveDialog(false);
  };

  const shareAnalysis = () => {
    const stats = currentStats();
    const raw = currentRaw();
    if (!stats || !raw) return;
    const name = snapshotName().trim() || `Analysis ${Date.now()}`;
    const state: ShareState = { type: 'analysis', data: raw, name };
    const encoded = encodeShareUrl(state);
    const url = `${window.location.origin}${window.location.pathname}?share=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    });
  };

  const deleteSnapshot = (id: number) => {
    setSnapshots(prev => prev.filter(e => e.id !== id));
  };

  const clearAllSnapshots = () => {
    if (confirm('Delete all saved snapshots?')) {
      setSnapshots([]);
    }
  };

  const loadSnapshot = (entry: ComparisonEntry) => {
    setCurrentStats(entry.data);
    setView('analysis');
    setShowManageSnapshots(false);
  };

  const handleFileLoad = (data: StatsData, raw: Record<string, unknown>) => {
    setCurrentStats(data);
    setCurrentRaw(raw);
    setView('analysis');
  };

  const loadFromText = (text: string) => {
    try {
      const raw = JSON.parse(text);
      const data = parseStats(raw);
      setCurrentStats(data);
      setCurrentRaw(raw);
    } catch (e) {
      console.error('Failed to parse stats:', e);
    }
  };

  const handlePasteStats = (text: string, name: string): ComparisonEntry | null => {
    let raw: Record<string, unknown>;
    let data: StatsData;
    try {
      raw = JSON.parse(text);
      data = parseStats(raw);
    } catch (e) {
      console.error('Failed to parse pasted stats:', e);
      return null;
    }
    const entry: ComparisonEntry = {
      id: Date.now(),
      name: name.trim() || `Snapshot ${snapshots().length + 1}`,
      data,
      raw,
      timestamp: new Date(),
    };
    setSnapshots(prev => [...prev, entry]);
    return entry;
  };

  const handleCompareFileLoad = (data: StatsData, raw: Record<string, unknown>) => {
    const entry: ComparisonEntry = {
      id: Date.now(),
      name: `Snapshot ${snapshots().length + 1}`,
      data,
      raw,
      timestamp: new Date(),
    };
    setSnapshots(prev => [...prev, entry]);
  };

  const handleCompareTextLoad = (text: string) => {
    try {
      const raw = JSON.parse(text);
      const data = parseStats(raw);
      const entry: ComparisonEntry = {
        id: Date.now(),
        name: `Snapshot ${snapshots().length + 1}`,
        data,
        raw,
        timestamp: new Date(),
      };
      setSnapshots(prev => [...prev, entry]);
    } catch (e) {
      console.error('Failed to parse stats:', e);
    }
  };

  const handleGenerateShareUrl = (left: ComparisonEntry, right: ComparisonEntry) => {
    const state: ShareState = {
      type: 'compare',
      left: left.raw,
      right: right.raw,
      leftName: left.name,
      rightName: right.name,
    };
    const encoded = encodeShareUrl(state);
    const url = `${window.location.origin}${window.location.pathname}?share=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    });
  };

  return (
    <div class="app">
      <header class="header">
        <div class="header-left">
          <h1>NS</h1>
        </div>
        <nav class="nav">
          <button class={view() === 'analysis' ? 'active' : ''} onClick={() => setView('analysis')}>
            Analysis
          </button>
          <button class={view() === 'compare' ? 'active' : ''} onClick={() => setView('compare')}>
            Compare ({snapshots().length})
          </button>
          <Show when={snapshots().length > 0}>
            <button
              class={showManageSnapshots() ? 'active' : ''}
              onClick={() => setShowManageSnapshots(true)}
              title="Manage Snapshots"
            >
              <Trash2Icon size={16} />
            </button>
          </Show>
          <select
            class="precision-select"
            value={precision()}
            onChange={e => setPrecision(parseInt(e.currentTarget.value, 10))}
            title="Decimal Precision"
          >
            <For each={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>
              {p => <option value={p}>{p} dp</option>}
            </For>
          </select>
        </nav>
      </header>

      <main class="main">
        <Show when={isLoading()}>
          <div class="loading">
            <div class="spinner"></div>
            <span>Loading saved data...</span>
          </div>
        </Show>
        <Show when={!isLoading()}>
          <Show when={view() === 'analysis'}>
            <Show when={!currentStats()}>
              <FileUpload
                onFileLoad={handleFileLoad}
                onTextLoad={loadFromText}
                snapshots={snapshots()}
                onLoadSnapshot={loadSnapshot}
              />
            </Show>
            <Show when={currentStats()}>
              <Analysis stats={currentStats()!} precision={precision()} />
              <Show when={showSaveDialog()}>
                <div class="modal-overlay" onClick={() => setShowSaveDialog(false)}>
                  <div class="modal" onClick={e => e.stopPropagation()}>
                    <h3>Save Snapshot</h3>
                    <input
                      type="text"
                      class="snapshot-name-input"
                      placeholder="Enter snapshot name..."
                      value={snapshotName()}
                      onInput={e => setSnapshotName(e.currentTarget.value)}
                      onKeyDown={e => e.key === 'Enter' && saveSnapshot()}
                      autofocus
                    />
                    <div class="modal-actions">
                      <button class="cancel-btn" onClick={() => setShowSaveDialog(false)}>
                        Cancel
                      </button>
                      <button class="confirm-btn" onClick={saveSnapshot}>
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </Show>
              <Show when={showOverrideModal()}>
                <div class="modal-overlay" onClick={() => setShowOverrideModal(false)}>
                  <div class="modal" onClick={e => e.stopPropagation()}>
                    <h3>Override Analysis?</h3>
                    <p style={{ color: 'var(--text-secondary)', 'margin-bottom': '1rem' }}>
                      This will replace the current analysis with pasted data.
                    </p>
                    <div class="modal-actions">
                      <button class="cancel-btn" onClick={() => setShowOverrideModal(false)}>
                        Cancel
                      </button>
                      <button
                        class="confirm-btn"
                        onClick={() => {
                          loadFromText(pendingOverrideText());
                          setShowOverrideModal(false);
                        }}
                      >
                        Override
                      </button>
                    </div>
                  </div>
                </div>
              </Show>
            </Show>
          </Show>

          <Show when={view() === 'compare'}>
            <ComparisonView
              entries={snapshots()}
              onSelect={entry => setCurrentStats(entry.data)}
              onDelete={deleteSnapshot}
              precision={precision()}
              pasteMode={pasteMode()}
              onPasteModeChange={setPasteMode}
              onPasteStats={handlePasteStats}
              onFileLoad={handleCompareFileLoad}
              onTextLoad={handleCompareTextLoad}
              onGenerateShareUrl={handleGenerateShareUrl}
              initialLeftId={initialLeftId()}
              initialRightId={initialRightId()}
              onInitialSelectionUsed={() => {
                setInitialLeftId(null);
                setInitialRightId(null);
              }}
            />
          </Show>
        </Show>
      </main>

      <footer class="footer">
        <a
          href="https://github.com/notashelf/ns"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-link"
        >
          <img src="/assets/github.svg" alt="GitHub" width={16} height={16} />
          Source
        </a>
      </footer>

      <Show when={showManageSnapshots()}>
        <div class="modal-overlay" onClick={() => setShowManageSnapshots(false)}>
          <div class="modal modal-large" onClick={e => e.stopPropagation()}>
            <div class="modal-header">
              <h3>Manage Snapshots</h3>
              <button class="close-btn" onClick={() => setShowManageSnapshots(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <div class="snapshot-list-manage">
              <For each={snapshots()} fallback={<div class="empty-state">No snapshots saved</div>}>
                {entry => (
                  <div class="snapshot-manage-item">
                    <div class="snapshot-info" onClick={() => loadSnapshot(entry)}>
                      <span class="snapshot-name">{entry.name}</span>
                      <span class="snapshot-date">
                        {new Date(entry.timestamp).toLocaleDateString()}{' '}
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <button class="delete-btn" onClick={() => deleteSnapshot(entry.id)}>
                      <XIcon size={16} />
                    </button>
                  </div>
                )}
              </For>
            </div>
            <Show when={snapshots().length > 0}>
              <div class="modal-actions">
                <button class="danger-btn" onClick={clearAllSnapshots}>
                  <Trash2Icon size={16} />
                  Clear All
                </button>
              </div>
            </Show>
          </div>
        </div>
      </Show>

      <Show when={currentStats() && view() === 'analysis'}>
        <div class="floating-actions">
          <button
            class="action-btn save"
            onClick={() => setShowSaveDialog(true)}
            title="Save Snapshot"
          >
            <SaveIcon size={20} />
          </button>
          <button class="action-btn share" onClick={shareAnalysis} title="Share Analysis">
            <ShareIcon size={20} />
          </button>
          <button class="action-btn clear" onClick={() => setCurrentStats(null)} title="Load New">
            <UploadIcon size={20} />
          </button>
        </div>
      </Show>

      <Show when={showShareToast()}>
        <div class="toast">Share URL copied to clipboard!</div>
      </Show>
    </div>
  );
}

render(() => <App />, document.getElementById('root')!);
