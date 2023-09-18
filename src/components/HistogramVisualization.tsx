import { Component, For } from "solid-js";

type Props = {
  histogram: number[];
};

export const HistogramVisualization: Component<Props> = props => {
  const max = () => Math.max(...props.histogram);

  return (
    <div class="flex flex-row gap-1">
      <For each={props.histogram}>
        {(value, i) => (
          <div class="flex w-1 flex-col">
            <div class="h-full bg-gray-200" style={`height: ${(value / max()) * 100}%`} />
          </div>
        )}
      </For>
    </div>
  );
};
