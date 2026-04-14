import { Component, createMemo } from 'solid-js';
import { StatsData } from '@ns/core';
import { formatNumber } from '@ns/ui-utils';

interface ThunkChartProps {
  stats: StatsData;
  precision?: number;
}

const ThunkChart: Component<ThunkChartProps> = props => {
  const prec = () => props.precision ?? 2;
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
        <span class="ratio-label">
          Avoidance rate:{' '}
          {Math.round(avoidedRatio() * 100 * Math.pow(10, prec())) / Math.pow(10, prec())}%
        </span>
      </div>
    </div>
  );
};

export default ThunkChart;
