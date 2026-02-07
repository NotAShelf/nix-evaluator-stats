import { Component, createMemo } from 'solid-js';
import { StatsData } from '@ns/core';
import { formatNumber } from '@ns/ui-utils';

interface ThunkChartProps {
  stats: StatsData;
}

const ThunkChart: Component<ThunkChartProps> = props => {
  const maxValue = createMemo(() => Math.max(props.stats.nrThunks, props.stats.nrAvoided));

  const avoidedRatio = createMemo(() => {
    if (props.stats.nrThunks === 0) return 0;
    return Math.min(1, props.stats.nrAvoided / props.stats.nrThunks);
  });

  return (
    <div class="thunk-chart">
      <div class="thunk-bars">
        <div class="thunk-row">
          <div class="thunk-label">Created</div>
          <div class="thunk-bar-container">
            <div
              class="thunk-bar created"
              style={{
                width: `${maxValue() > 0 ? (props.stats.nrThunks / maxValue()) * 100 : 0}%`,
              }}
            />
          </div>
          <div class="thunk-value">{formatNumber(props.stats.nrThunks)}</div>
        </div>
        <div class="thunk-row">
          <div class="thunk-label">Avoided</div>
          <div class="thunk-bar-container">
            <div
              class="thunk-bar avoided"
              style={{
                width: `${maxValue() > 0 ? (props.stats.nrAvoided / maxValue()) * 100 : 0}%`,
              }}
            />
          </div>
          <div class="thunk-value">{formatNumber(props.stats.nrAvoided)}</div>
        </div>
      </div>

      <div class="thunk-ratio">
        <div class="ratio-bar">
          <div class="ratio-fill" style={{ width: `${avoidedRatio() * 100}%` }} />
        </div>
        <span class="ratio-label">Avoidance rate: {(avoidedRatio() * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
};

export default ThunkChart;
