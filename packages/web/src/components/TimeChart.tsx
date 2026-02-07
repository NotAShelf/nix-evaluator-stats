import { Component, createMemo, For, Show } from 'solid-js';
import { StatsData } from '@ns/core';
import { formatBytes, formatTime, formatPercent } from '@ns/ui-utils';

interface TimeChartProps {
  stats: StatsData;
}

const TimeChart: Component<TimeChartProps> = props => {
  const timeData = createMemo(() => {
    const cpu = props.stats.time.cpu;
    const gc = props.stats.time.gc || 0;
    const gcNonInc = props.stats.time.gcNonIncremental || 0;
    const other = Math.max(0, cpu - gc - gcNonInc);

    return [
      { label: 'Evaluation', value: other, colorClass: 'chart-1' },
      { label: 'Incremental GC', value: gc, colorClass: 'chart-gc' },
      { label: 'Full GC', value: gcNonInc, colorClass: 'chart-gc-full' },
    ].filter(d => d.value > 0);
  });

  const total = createMemo(() => timeData().reduce((sum, d) => sum + d.value, 0));

  const barData = createMemo(() => {
    return timeData().map(item => ({
      ...item,
      percent: total() > 0 ? (item.value / total()) * 100 : 0,
    }));
  });

  return (
    <div class="time-chart">
      <div class="time-bars">
        <For each={barData()}>
          {item => (
            <div class="time-bar-row">
              <div class="time-bar-label">{item.label}</div>
              <div class="time-bar-track">
                <div
                  class="time-bar-fill"
                  classList={{ [item.colorClass]: true }}
                  style={{
                    width: `${item.percent}%`,
                  }}
                />
              </div>
              <div class="time-bar-value">{formatTime(item.value)}</div>
            </div>
          )}
        </For>
      </div>

      <Show when={props.stats.gc}>
        <div class="gc-stats">
          <div class="gc-stat">
            <span class="gc-stat-label">GC Cycles</span>
            <span class="gc-stat-value">{props.stats.gc?.cycles || 0}</span>
          </div>
          <div class="gc-stat">
            <span class="gc-stat-label">Heap Size</span>
            <span class="gc-stat-value">{formatBytes(props.stats.gc?.heapSize || 0)}</span>
          </div>
          <div class="gc-stat">
            <span class="gc-stat-label">GC Fraction</span>
            <span class="gc-stat-value">{formatPercent(props.stats.time.gcFraction || 0)}</span>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default TimeChart;
