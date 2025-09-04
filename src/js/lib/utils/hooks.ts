import { useLayoutEffect, useRef } from "react";

export function useEventCallback<T extends (...args: any[]) => any>(fn: T) {
  const latestRef = useRef<T | null>(null);
  const stableRef = useRef<T | null>(null);

  if (stableRef.current == null) {
    stableRef.current = function (this: any) {
      latestRef.current!.apply(this, arguments as any);
    } as T;
  }

  useLayoutEffect(() => {
    latestRef.current = fn;
  }, [fn]);

  return stableRef.current;
}
