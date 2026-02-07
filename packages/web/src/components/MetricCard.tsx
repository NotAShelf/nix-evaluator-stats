import { Component, createSignal, Show } from 'solid-js';

interface MetricCardProps {
  label: string;
  value: string;
  tooltip?: string;
  highlight?: boolean;
}

const MetricCard: Component<MetricCardProps> = props => {
  const [showTooltip, setShowTooltip] = createSignal(false);
  const [tooltipPos, setTooltipPos] = createSignal<{
    top: number;
    left: number;
    position: 'top' | 'bottom';
  } | null>(null);
  let cardRef: HTMLDivElement | undefined;

  const updateTooltipPosition = () => {
    if (!cardRef || !showTooltip()) {
      setTooltipPos(null);
      return;
    }

    const rect = cardRef.getBoundingClientRect();
    const tooltipHeight = 60;
    const tooltipWidth = 280;
    const margin = 8;

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    const position: 'top' | 'bottom' =
      spaceAbove >= tooltipHeight + margin || spaceBelow < tooltipHeight + margin
        ? 'top'
        : 'bottom';
    const top = position === 'top' ? rect.top - tooltipHeight - margin : rect.bottom + margin;
    const left = Math.max(
      margin,
      Math.min(
        rect.left + rect.width / 2 - tooltipWidth / 2,
        window.innerWidth - tooltipWidth - margin,
      ),
    );

    setTooltipPos({ top, left, position });
  };

  const handleMouseEnter = () => {
    setShowTooltip(true);
    updateTooltipPosition();
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
    setTooltipPos(null);
  };

  return (
    <div
      ref={cardRef}
      class={`metric-card ${props.highlight ? 'highlight' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={updateTooltipPosition}
    >
      <div class="metric-value">{props.value}</div>
      <div class="metric-label">{props.label}</div>
      <Show when={props.tooltip && tooltipPos()}>
        <div
          class="tooltip"
          data-position={tooltipPos()?.position}
          style={{
            top: `${tooltipPos()?.top}px`,
            left: `${tooltipPos()?.left}px`,
          }}
        >
          {props.tooltip}
        </div>
      </Show>
    </div>
  );
};

export default MetricCard;
