import { For } from "solid-js";

type Props<T> = {
  label: (value: T) => string;
  values: T[];
  selected: T;
  onInput: (n: T) => void;
  class?: string;
};

export const RadioGroup = <T extends unknown>(props: Props<T>) => {
  return (
    <div class="flex flex-col gap-2">
      <For each={props.values}>
        {value => (
          <label class="flex items-center">
            <input
              type="radio"
              class="text-slate-900"
              value={props.label(value)}
              checked={value === props.selected}
              onInput={() => props.onInput(value)}
            />
            <span class="ml-2 text-sm">{props.label(value)}</span>
          </label>
        )}
      </For>
    </div>
  );
};
