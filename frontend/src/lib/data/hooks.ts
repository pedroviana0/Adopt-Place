import { useSyncExternalStore } from "react";
import { subscribeSessao, getSessao } from "./sessao";

export function useSessao() {
  return useSyncExternalStore(
    (cb) => subscribeSessao(cb),
    () => getSessao(),
    () => null
  );
}
