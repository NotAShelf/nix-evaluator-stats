import { createSignal, Show } from 'solid-js';
import { StatsData } from '../utils/types';
import { BarChart2 } from 'lucide-solid';

interface FileUploadProps {
  onFileLoad: (data: StatsData) => void;
  onTextLoad: (text: string) => void;
  showHelp: boolean;
  onToggleHelp: () => void;
}

export default function FileUpload(props: FileUploadProps) {
  const [textInput, setTextInput] = createSignal('');
  const [isTextMode, setIsTextMode] = createSignal(false);
  const [error, setError] = createSignal('');

  const handleFile = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      props.onFileLoad(json);
    } catch {
      setError('Invalid JSON file');
    }
  };

  const handleTextLoad = () => {
    if (!textInput().trim()) return;
    try {
      JSON.parse(textInput());
      props.onTextLoad(textInput());
    } catch {
      setError('Invalid JSON');
    }
  };

  return (
    <div class="upload-container">
      <div class="upload-card">
        <div class="upload-icon">
          <BarChart2 size={48} />
        </div>
        <h2>Load Statistics</h2>

        <div class="help-link" onClick={props.onToggleHelp}>
          How do I use this?
        </div>

        <Show when={props.showHelp}>
          <div class="help-panel">
            <h4>Generating Stats</h4>
            <code>NIX_SHOW_STATS=1 nix-instantiate expr.nix &gt; stats.json</code>
            <code>NIX_SHOW_STATS=1 NIX_COUNT_CALLS=1 nix-build &gt; stats.json</code>
            <p>
              Or use <code>NIX_SHOW_STATS_PATH=/path/to/output.json</code> for file output.
            </p>
          </div>
        </Show>

        <div class="upload-mode-toggle">
          <button class={!isTextMode() ? 'active' : ''} onClick={() => setIsTextMode(false)}>
            File
          </button>
          <button class={isTextMode() ? 'active' : ''} onClick={() => setIsTextMode(true)}>
            Paste
          </button>
        </div>

        <Show when={!isTextMode()}>
          <label class="file-input-label">
            <input type="file" accept=".json" onChange={handleFile} />
            <span>Choose File</span>
          </label>
        </Show>

        <Show when={isTextMode()}>
          <textarea
            class="json-input"
            value={textInput()}
            onInput={e => setTextInput(e.currentTarget.value)}
          />
          <button class="load-btn" onClick={handleTextLoad}>
            Load
          </button>
        </Show>

        <Show when={error()}>
          <div class="error">{error()}</div>
        </Show>
      </div>
    </div>
  );
}
