import { Collapsible as KobalteCollapsible } from "@kobalte/core";
import { ChevronDownIcon } from "lucide-solid";
import { JSX } from "solid-js";

type Props = {
  title: string;
  children: JSX.Element;
};

export const Collapsible = (props: Props) => {
  return (
    <KobalteCollapsible.Root class="w-full bg-white">
      <KobalteCollapsible.Trigger class="group flex w-full justify-between gap-2 p-3">
        <span>{props.title}</span>
        <ChevronDownIcon class="text-slate-500 group-data-[expanded]:rotate-180 group-data-[closed]:rotate-0" />
      </KobalteCollapsible.Trigger>
      <KobalteCollapsible.Content class="max-h-full overflow-hidden bg-slate-100 data-[expanded]:open-vertical data-[closed]:close-vertical">
        {props.children}
      </KobalteCollapsible.Content>
    </KobalteCollapsible.Root>
  );
};
