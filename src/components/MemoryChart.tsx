import { Component, For, createMemo } from 'solid-js';
import { formatBytes } from '../utils/formatters';

interface MemoryChartProps {
  data: Array<{
    label: string;
    value: number;
    total: number;
    colorClass: string;
  }>;
}

const MemoryChart: Component<MemoryChartProps> = props => {
  const chartData = createMemo(() => {
    const total = props.data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return [];

    let cumulative = 0;
    return props.data.map(item => {
      const startAngle = (cumulative / total) * 360;
      cumulative += item.value;
      const endAngle = (cumulative / total) * 360;
      const largeArc = endAngle - startAngle > 180 ? 1 : 0;
      return {
        ...item,
        startAngle,
        endAngle,
        largeArc,
        percentage: ((item.value / total) * 100).toFixed(1),
      };
    });
  });

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeArc = (
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
    largeArc: number,
  ) => {
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  return (
    <div class="memory-chart">
      <div class="chart-legend">
        <For each={chartData()}>
          {item => (
            <div class="legend-item">
              <span class="legend-color" classList={{ [item.colorClass]: true }} />
              <span class="legend-label">{item.label}</span>
              <span class="legend-value">{formatBytes(item.value)}</span>
              <span class="legend-percent">{item.percentage}%</span>
            </div>
          )}
        </For>
      </div>
      <div class="donut-chart">
        <svg viewBox="0 0 200 200">
          <For each={chartData()}>
            {item => (
              <path
                d={describeArc(100, 100, 70, item.startAngle, item.endAngle, item.largeArc)}
                fill="none"
                classList={{ [item.colorClass]: true }}
                stroke-width="35"
              />
            )}
          </For>
          <circle cx="100" cy="100" r="52" fill="var(--card-bg)" />
          <text x="100" y="95" text-anchor="middle" class="chart-center-value">
            {formatBytes(props.data.reduce((sum, d) => sum + d.value, 0))}
          </text>
          <text x="100" y="110" text-anchor="middle" class="chart-center-label">
            Total
          </text>
        </svg>
      </div>
    </div>
  );
};

export default MemoryChart;
