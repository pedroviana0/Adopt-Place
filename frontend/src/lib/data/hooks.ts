import { useSyncExternalStore } from "react";
import { subscribe } from "./db";
import { subscribeSessao, getSessao } from "./sessao";

// Reactivity hook — components subscribe to DB changes to re-render.
export function useDbVersion(): number {
  return useSyncExternalStore(
    (cb) => subscribe(cb),
    () => __ver.value,
    () => 0
  );
}

const __ver = { value: 0 };
subscribe(() => {
  __ver.value += 1;
});

export function useSessao() {
  return useSyncExternalStore(
    (cb) => subscribeSessao(cb),
    () => getSessao(),
    () => null
  );
}
