import { createEffect } from "solid-js";
import { clx } from "../utils";

type InputProps = ({ int: true } | { float: true }) & {
  label: string;
  value: number;
  onInput: (n: number) => void;
  class?: string;
  min?: number;
  max?: number;
};

export const Input = (props: InputProps) => {
  return (
    <div class="flex w-full flex-col text-sm">
      <label class="ml-1 truncate font-medium text-slate-900">{props.label}</label>
      <input
        type="number"
        class={clx(
          "w-full rounded border border-slate-100 bg-white px-4 py-2 font-medium text-slate-900",
          props.class
        )}
        value={props.value}
        onInput={e => {
          let n = Number(e.currentTarget.value);
          if (!!props.max && n > props.max) {
            n = props.max;
          } else if (!!props.min && n < props.min) {
            n = props.min;
          }
          if (Number(e.currentTarget.value) !== n) {
            e.currentTarget.value = n.toString();
          }
          props.onInput(n);
        }}
        min={props.min}
        max={props.max}
        step={"int" in props ? 1 : 0.1}
      />
    </div>
  );
};
