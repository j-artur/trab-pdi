import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type Falsy<T> =
  | T
  | (T extends number ? 0 : never)
  | (T extends string ? "" : never)
  | false
  | null
  | undefined;

export type ClassValue = ClassValue[] | Falsy<string> | Record<string, Falsy<unknown>>;
export function clx(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
