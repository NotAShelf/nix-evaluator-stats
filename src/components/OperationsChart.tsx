import { Component, For, createMemo } from 'solid-js';
import { StatsData } from '../utils/types';
import { formatNumber } from '../utils/formatters';

interface OperationsChartProps {
  stats: StatsData;
}

const OperationsChart: Component<OperationsChartProps> = props => {
  const operations = createMemo(() =>
    [
      { label: 'Lookups', value: props.stats.nrLookups, colorClass: 'chart-1' },
      { label: 'Function Calls', value: props.stats.nrFunctionCalls, colorClass: 'chart-2' },
      { label: 'PrimOp Calls', value: props.stats.nrPrimOpCalls, colorClass: 'chart-3' },
      { label: 'Op Updates', value: props.stats.nrOpUpdates, colorClass: 'chart-4' },
      { label: 'Values Copied', value: props.stats.nrOpUpdateValuesCopied, colorClass: 'chart-5' },
    ].sort((a, b) => b.value - a.value),
  );

  const maxValue = createMemo(() => Math.max(...operations().map(o => o.value)));

  return (
    <div class="operations-chart">
      <For each={operations()}>
        {item => (
          <div class="op-row">
            <div class="op-label">{item.label}</div>
            <div class="op-bar-container">
              <div
                class="op-bar"
                classList={{ [item.colorClass]: true }}
                style={{
                  width: `${maxValue() > 0 ? (item.value / maxValue()) * 100 : 0}%`,
                }}
              />
            </div>
            <div class="op-value">{formatNumber(item.value)}</div>
          </div>
        )}
      </For>
    </div>
  );
};

export default OperationsChart;
