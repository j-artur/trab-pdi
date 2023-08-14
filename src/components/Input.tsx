import { clx } from "../utils";

type InputProps = {
  label: string;
  value: number;
  onInput: (n: number) => void;
  class?: string;
  min?: number;
  max?: number;
};

export const Input = (props: InputProps) => {
  return (
    <div class="flex flex-row items-center text-sm">
      <label class="mr-2 w-full font-medium text-slate-900">{props.label}</label>
      <input
        type="number"
        class={clx(
          "w-full rounded border border-slate-100 bg-white px-4 py-2 font-medium text-slate-900",
          props.class
        )}
        value={props.value}
        onInput={e => props.onInput(parseInt((e.target as HTMLInputElement).value))}
      />
    </div>
  );
};
