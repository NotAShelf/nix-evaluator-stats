import { Component, type JSX, Show, createUniqueId, onCleanup, onMount } from 'solid-js';
import XIcon from 'lucide-solid/icons/x';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: JSX.Element;
  large?: boolean;
  closeButton?: boolean;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Modal: Component<ModalProps> = props => {
  const titleId = createUniqueId();
  let dialogRef: HTMLDivElement | undefined;
  const previousFocus = document.activeElement as HTMLElement | null;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      props.onClose();
      return;
    }
    if (e.key !== 'Tab' || !dialogRef) return;
    const focusable = Array.from(dialogRef.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  onMount(() => {
    const target =
      dialogRef?.querySelector<HTMLElement>('[data-autofocus]') ??
      dialogRef?.querySelector<HTMLElement>(FOCUSABLE);
    (target ?? dialogRef)?.focus();
  });

  onCleanup(() => previousFocus?.focus?.());

  return (
    <div class="modal-overlay" onClick={() => props.onClose()}>
      <div
        ref={dialogRef}
        class={`modal ${props.large ? 'modal-large' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div class="modal-header">
          <h3 id={titleId}>{props.title}</h3>
          <Show when={props.closeButton}>
            <button class="close-btn" onClick={() => props.onClose()} aria-label="Close">
              <XIcon size={20} aria-hidden="true" />
            </button>
          </Show>
        </div>
        {props.children}
      </div>
    </div>
  );
};

export default Modal;
