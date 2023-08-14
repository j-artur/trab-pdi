import { JSX } from "solid-js";
import { clx } from "../utils";

type ButtonProps = {
  children: JSX.Element;
  class?: string;
  onClick?: (e: MouseEvent) => void;
  disabled?: boolean;
};

export const Button = (props: ButtonProps) => {
  return (
    <button
      class={clx(
        "rounded border border-slate-100 bg-white px-4 py-2 text-sm text-slate-900",
        {
          "hover:bg-slate-50": !props.disabled,
          "opacity-50": props.disabled,
        },
        props.class
      )}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
};
