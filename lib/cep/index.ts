import { ProvedorBrasilApi } from "@/lib/cep/brasilapi";
import type { ProvedorCep } from "@/lib/cep/provider";
import { ProvedorViaCep } from "@/lib/cep/viacep";

const PROVEDORES: Record<string, () => ProvedorCep> = {
  brasilapi: () => new ProvedorBrasilApi(),
  viacep: () => new ProvedorViaCep(),
};

/**
 * Provedor ativo, escolhido por CEP_PROVIDER. Trocar de provedor e trocar a
 * variavel de ambiente: nenhum chamador conhece a implementacao.
 */
export function provedorCep(): ProvedorCep {
  const escolhido = process.env.CEP_PROVIDER?.trim().toLowerCase();
  const fabrica = escolhido ? PROVEDORES[escolhido] : undefined;

  if (escolhido && !fabrica) {
    throw new Error(
      `CEP_PROVIDER "${escolhido}" desconhecido. Use: ${Object.keys(PROVEDORES).join(", ")}.`,
    );
  }

  return (fabrica ?? PROVEDORES.brasilapi)();
}

export { ProvedorBrasilApi } from "@/lib/cep/brasilapi";
export { ProvedorViaCep } from "@/lib/cep/viacep";
export type {
  EnderecoPorCep,
  ProvedorCep,
  ResultadoCep,
} from "@/lib/cep/provider";
