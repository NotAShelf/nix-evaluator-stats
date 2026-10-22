import { createSignal, Show, For, onMount, onCleanup, createEffect, lazy } from 'solid-js';
import { render } from 'solid-js/web';
import SaveIcon from 'lucide-solid/icons/save';
import UploadIcon from 'lucide-solid/icons/upload';
import Trash2Icon from 'lucide-solid/icons/trash-2';
import XIcon from 'lucide-solid/icons/x';
import ShareIcon from 'lucide-solid/icons/link-2';
import FileUpload from './components/FileUpload';
import Modal from './components/Modal';
import { StatsData, ComparisonEntry, parseStats, ShareState } from '@ns/core';
import './styles.css';

// lzutf8 and its stream/buffer polyfills dominate the bundle, so share links
// load it on demand instead of on every visit.
const loadShare = () => import('@ns/core/share');

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
  const [toastMessage, setToastMessage] = createSignal('');
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
    const loadShared = async (shareParam: string) => {
      const { decodeShareUrl } = await loadShare();
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
    };

    if (shareParam) {
      loadShared(shareParam)
        .catch(e => console.warn('Failed to load shared data:', e))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    const preload = () => {
      Analysis.preload();
      ComparisonView.preload();
    };
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preload);
    } else {
      setTimeout(preload, 200);
    }

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

    onCleanup(() => document.removeEventListener('paste', handleAnalysisPaste));
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

  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  const showToast = (message: string) => {
    clearTimeout(toastTimer);
    setToastMessage(message);
    toastTimer = setTimeout(() => setToastMessage(''), 2500);
  };

  const copyShareUrl = async (state: ShareState) => {
    try {
      const { encodeShareUrl } = await loadShare();
      const encoded = encodeShareUrl(state);
      const url = `${window.location.origin}${window.location.pathname}?share=${encoded}`;
      await navigator.clipboard.writeText(url);
      showToast('Share URL copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy share URL:', err);
      showToast('Failed to copy share URL');
    }
  };

  const shareAnalysis = () => {
    const stats = currentStats();
    const raw = currentRaw();
    if (!stats || !raw) return;
    const name = snapshotName().trim() || `Analysis ${Date.now()}`;
    copyShareUrl({ type: 'analysis', data: raw, name });
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
    setCurrentRaw(entry.raw);
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
    copyShareUrl(state);
  };

  return (
    <div class="app">
      <header class="header">
        <div class="header-left">
          <h1>NS</h1>
        </div>
        <nav class="nav" aria-label="Views">
          <button
            class={view() === 'analysis' ? 'active' : ''}
            aria-pressed={view() === 'analysis'}
            onClick={() => setView('analysis')}
          >
            Analysis
          </button>
          <button
            class={view() === 'compare' ? 'active' : ''}
            aria-pressed={view() === 'compare'}
            onClick={() => setView('compare')}
          >
            Compare ({snapshots().length})
          </button>
          <Show when={snapshots().length > 0}>
            <button
              class={showManageSnapshots() ? 'active' : ''}
              onClick={() => setShowManageSnapshots(true)}
              title="Manage Snapshots"
              aria-label="Manage snapshots"
            >
              <Trash2Icon size={16} aria-hidden="true" />
            </button>
          </Show>
          <select
            class="precision-select"
            value={precision()}
            onChange={e => setPrecision(parseInt(e.currentTarget.value, 10))}
            title="Decimal Precision"
            aria-label="Decimal precision"
          >
            <For each={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>
              {p => <option value={p}>{p} dp</option>}
            </For>
          </select>
        </nav>
      </header>

      <main class="main">
        <Show when={isLoading()}>
          <div class="loading" role="status">
            <div class="spinner" aria-hidden="true"></div>
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
                <Modal title="Save Snapshot" onClose={() => setShowSaveDialog(false)}>
                  <input
                    type="text"
                    class="snapshot-name-input"
                    placeholder="Enter snapshot name..."
                    aria-label="Snapshot name"
                    value={snapshotName()}
                    onInput={e => setSnapshotName(e.currentTarget.value)}
                    onKeyDown={e => e.key === 'Enter' && saveSnapshot()}
                    data-autofocus
                  />
                  <div class="modal-actions">
                    <button class="cancel-btn" onClick={() => setShowSaveDialog(false)}>
                      Cancel
                    </button>
                    <button class="confirm-btn" onClick={saveSnapshot}>
                      Save
                    </button>
                  </div>
                </Modal>
              </Show>
              <Show when={showOverrideModal()}>
                <Modal title="Override Analysis?" onClose={() => setShowOverrideModal(false)}>
                  <p class="modal-text">This will replace the current analysis with pasted data.</p>
                  <div class="modal-actions">
                    <button class="cancel-btn" onClick={() => setShowOverrideModal(false)}>
                      Cancel
                    </button>
                    <button
                      class="confirm-btn"
                      data-autofocus
                      onClick={() => {
                        loadFromText(pendingOverrideText());
                        setShowOverrideModal(false);
                      }}
                    >
                      Override
                    </button>
                  </div>
                </Modal>
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
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
          Source
        </a>
      </footer>

      <Show when={showManageSnapshots()}>
        <Modal
          title="Manage Snapshots"
          onClose={() => setShowManageSnapshots(false)}
          large
          closeButton
        >
          <ul class="snapshot-list-manage">
            <For each={snapshots()} fallback={<li class="empty-state">No snapshots saved</li>}>
              {entry => (
                <li class="snapshot-manage-item">
                  <button class="snapshot-info" onClick={() => loadSnapshot(entry)}>
                    <span class="snapshot-name">{entry.name}</span>
                    <span class="snapshot-date">
                      {new Date(entry.timestamp).toLocaleDateString()}{' '}
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </button>
                  <button
                    class="delete-btn"
                    onClick={() => deleteSnapshot(entry.id)}
                    aria-label={`Delete ${entry.name}`}
                  >
                    <XIcon size={16} aria-hidden="true" />
                  </button>
                </li>
              )}
            </For>
          </ul>
          <Show when={snapshots().length > 0}>
            <div class="modal-actions">
              <button class="danger-btn" onClick={clearAllSnapshots}>
                <Trash2Icon size={16} aria-hidden="true" />
                Clear All
              </button>
            </div>
          </Show>
        </Modal>
      </Show>

      <Show when={currentStats() && view() === 'analysis'}>
        <div class="floating-actions" role="toolbar" aria-label="Analysis actions">
          <button
            class="action-btn save"
            onClick={() => setShowSaveDialog(true)}
            title="Save Snapshot"
            aria-label="Save snapshot"
          >
            <SaveIcon size={20} aria-hidden="true" />
          </button>
          <button
            class="action-btn share"
            onClick={shareAnalysis}
            title="Share Analysis"
            aria-label="Copy share URL"
          >
            <ShareIcon size={20} aria-hidden="true" />
          </button>
          <button
            class="action-btn clear"
            onClick={() => setCurrentStats(null)}
            title="Load New"
            aria-label="Load new statistics"
          >
            <UploadIcon size={20} aria-hidden="true" />
          </button>
        </div>
      </Show>

      <div class="toast" classList={{ visible: !!toastMessage() }} role="status" aria-live="polite">
        {toastMessage()}
      </div>
    </div>
  );
}

render(() => <App />, document.getElementById('root')!);
