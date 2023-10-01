type Props = {
  label: string;
  checked: boolean;
  onInput: (b: boolean) => void;
};

export const Checkbox = (props: Props) => {
  return (
    <label class="flex flex-row items-center">
      <input
        type="checkbox"
        class="text-slate-900"
        checked={props.checked}
        onInput={e => props.onInput((e.target as HTMLInputElement).checked)}
      />
      <span class="ml-2 text-sm">{props.label}</span>
    </label>
  );
};
