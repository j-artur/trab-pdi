import { JSX } from "solid-js";
import { clx } from "../utils";

type InputProps = {
  label: string;
  value: string;
  onInput: (n: string) => void;
  class?: string;
  style?: JSX.HTMLAttributes<HTMLInputElement>["style"];
};

export const TextInput = (props: InputProps) => {
  return (
    <div class="flex w-full flex-col text-sm">
      <label class="ml-1 truncate font-medium text-slate-900">{props.label}</label>
      <input
        type="text"
        class={clx(
          "w-full rounded border border-slate-100 bg-white px-4 py-2 font-medium text-slate-900",
          props.class
        )}
        value={props.value}
        onInput={e => {
          props.onInput(e.currentTarget.value);
        }}
        style={props.style}
      />
    </div>
  );
};
