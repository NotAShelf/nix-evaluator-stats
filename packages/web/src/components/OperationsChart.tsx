import { Component, For, createMemo } from 'solid-js';
import { StatsData } from '@ns/core';
import { formatNumber } from '@ns/ui-utils';

interface OperationsChartProps {
  stats: StatsData;
  precision?: number;
}

const OperationsChart: Component<OperationsChartProps> = props => {
  const prec = () => props.precision ?? 2;
  const operations = createMemo(() =>
    [
      { label: 'Lookups', value: props.stats.nrLookups, series: 'lookups' },
      { label: 'Function Calls', value: props.stats.nrFunctionCalls, series: 'calls' },
      { label: 'PrimOp Calls', value: props.stats.nrPrimOpCalls, series: 'primops' },
      { label: 'Op Updates', value: props.stats.nrOpUpdates, series: 'updates' },
      { label: 'Values Copied', value: props.stats.nrOpUpdateValuesCopied, series: 'copied' },
    ].sort((a, b) => b.value - a.value),
  );

  const maxValue = createMemo(() => Math.max(...operations().map(o => o.value)));

  return (
    <div class="operations-chart">
      <For each={operations()}>
        {item => (
          <div class="op-row">
            <div class="op-label">{item.label}</div>
            <div class="op-bar-container" aria-hidden="true">
              <div
                class="op-bar"
                data-series={item.series}
                style={{
                  width: `${maxValue() > 0 ? (item.value / maxValue()) * 100 : 0}%`,
                }}
              />
            </div>
            <div class="op-value">{formatNumber(item.value, prec())}</div>
          </div>
        )}
      </For>
    </div>
  );
};

export default OperationsChart;
