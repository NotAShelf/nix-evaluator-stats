import { Component, createSignal, createUniqueId, Show } from 'solid-js';

interface MetricCardProps {
  label: string;
  value: string;
  tooltip?: string;
  highlight?: boolean;
}

const TOOLTIP_WIDTH = 280;
const MARGIN = 8;
const MIN_SPACE_ABOVE = 72;

const MetricCard: Component<MetricCardProps> = props => {
  const tooltipId = createUniqueId();
  const [tooltipPos, setTooltipPos] = createSignal<{
    top?: number;
    bottom?: number;
    left: number;
    position: 'top' | 'bottom';
  } | null>(null);
  let cardRef: HTMLDivElement | undefined;

  const show = () => {
    if (!cardRef || !props.tooltip) return;

    const rect = cardRef.getBoundingClientRect();
    const halfWidth = Math.min(TOOLTIP_WIDTH, window.innerWidth - MARGIN * 2) / 2;
    const left = Math.max(
      MARGIN + halfWidth,
      Math.min(rect.left + rect.width / 2, window.innerWidth - MARGIN - halfWidth),
    );

    if (rect.top >= MIN_SPACE_ABOVE) {
      setTooltipPos({ bottom: window.innerHeight - rect.top + MARGIN, left, position: 'top' });
    } else {
      setTooltipPos({ top: rect.bottom + MARGIN, left, position: 'bottom' });
    }
  };

  const hide = () => setTooltipPos(null);

  return (
    <div
      ref={cardRef}
      class={`metric-card ${props.highlight ? 'highlight' : ''}`}
      tabIndex={props.tooltip ? 0 : undefined}
      aria-describedby={props.tooltip ? tooltipId : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onKeyDown={e => e.key === 'Escape' && hide()}
    >
      <div class="metric-value">{props.value}</div>
      <div class="metric-label">{props.label}</div>
      <Show when={props.tooltip}>
        <div
          id={tooltipId}
          role="tooltip"
          class="tooltip"
          classList={{ visible: !!tooltipPos() }}
          data-position={tooltipPos()?.position}
          style={{
            top: tooltipPos()?.top !== undefined ? `${tooltipPos()!.top}px` : 'auto',
            bottom: tooltipPos()?.bottom !== undefined ? `${tooltipPos()!.bottom}px` : 'auto',
            left: `${tooltipPos()?.left ?? 0}px`,
          }}
        >
          {props.tooltip}
        </div>
      </Show>
    </div>
  );
};

export default MetricCard;
