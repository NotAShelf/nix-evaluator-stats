import { Component, For, createMemo } from 'solid-js';
import { formatBytes } from '@ns/ui-utils';

export type MemoryCategory = 'envs' | 'lists' | 'values' | 'symbols' | 'sets';

interface MemoryChartProps {
  data: Array<{
    label: string;
    value: number;
    category: MemoryCategory;
  }>;
}

// Angular gap between segments, roughly 2px at the ring's mid radius.
const SEGMENT_GAP = 1.6;

const MemoryChart: Component<MemoryChartProps> = props => {
  const total = createMemo(() => props.data.reduce((sum, item) => sum + item.value, 0));

  const legend = createMemo(() =>
    props.data.map(item => ({
      ...item,
      percentage: total() > 0 ? ((item.value / total()) * 100).toFixed(1) : '0.0',
    })),
  );

  const segments = createMemo(() => {
    if (total() === 0) return [];
    const visible = props.data.filter(item => item.value > 0);
    const gap = visible.length > 1 ? SEGMENT_GAP : 0;

    let cumulative = 0;
    return visible.map(item => {
      const start = (cumulative / total()) * 360;
      cumulative += item.value;
      const end = (cumulative / total()) * 360;
      const span = end - start;
      const inset = span > gap * 2 ? gap / 2 : 0;
      return { ...item, startAngle: start + inset, endAngle: end - inset, full: span >= 359.99 };
    });
  });

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  return (
    <div class="memory-chart">
      <div
        class="chart-legend"
        role="list"
        aria-label={`Memory distribution, total ${formatBytes(total())}`}
      >
        <For each={legend()}>
          {item => (
            <div class="legend-item" role="listitem" data-category={item.category}>
              <span class="legend-color" aria-hidden="true" />
              <span class="legend-label">{item.label}</span>
              <span class="legend-value">{formatBytes(item.value)}</span>
              <span class="legend-percent">{item.percentage}%</span>
            </div>
          )}
        </For>
      </div>
      <div class="donut-chart" aria-hidden="true">
        <svg viewBox="0 0 200 200">
          <For each={segments()}>
            {item =>
              item.full ? (
                <circle cx="100" cy="100" r="70" fill="none" data-category={item.category} />
              ) : (
                <path
                  d={describeArc(100, 100, 70, item.startAngle, item.endAngle)}
                  fill="none"
                  data-category={item.category}
                />
              )
            }
          </For>
          <circle cx="100" cy="100" r="52" fill="var(--card-bg)" />
          <text
            x="100"
            y="93"
            text-anchor="middle"
            dominant-baseline="central"
            class="chart-center-value"
          >
            {formatBytes(total())}
          </text>
          <text
            x="100"
            y="113"
            text-anchor="middle"
            dominant-baseline="central"
            class="chart-center-label"
          >
            Total
          </text>
        </svg>
      </div>
    </div>
  );
};

export default MemoryChart;
