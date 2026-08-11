import { apiRequest } from "./api";

export interface EnderecoPorCep {
  cep: string;
  logradouro: string | null;
  bairro: string | null;
  cidade: string;
  estado: string;
  municipioId: string;
}

export interface MunicipioOpcao {
  codigoIbge: string;
  nome: string;
  uf: string;
}

/**
 * Desfechos da consulta, espelhando o contrato do backend. São tratamentos
 * diferentes na tela: `nao_encontrado` é erro do campo, `indisponivel` abre a
 * escolha manual de município.
 */
export type ConsultaCep =
  | { situacao: "encontrado"; endereco: EnderecoPorCep }
  | { situacao: "nao_encontrado" }
  | { situacao: "indisponivel" };

export function somenteDigitos(cep: string): string {
  return cep.replace(/\D/g, "");
}

export function mascaraCep(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export async function consultarCep(cep: string): Promise<ConsultaCep> {
  const digitos = somenteDigitos(cep);

  try {
    const data = await apiRequest<{ endereco: EnderecoPorCep }>(
      `/api/cep/${digitos}`,
      { method: "GET" },
    );
    return { situacao: "encontrado", endereco: data.endereco };
  } catch (erro) {
    const code = (erro as { code?: string }).code;
    // MUNICIPALITY_NOT_FOUND também vira indisponível: o CEP existe, mas não
    // conseguimos localizá-lo — a saída para a pessoa é a mesma.
    return code === "CEP_NOT_FOUND"
      ? { situacao: "nao_encontrado" }
      : { situacao: "indisponivel" };
  }
}

export async function buscarMunicipios(busca: string): Promise<MunicipioOpcao[]> {
  if (busca.trim().length < 2) return [];
  const data = await apiRequest<{ municipios: MunicipioOpcao[] }>(
    `/api/municipios?busca=${encodeURIComponent(busca.trim())}`,
    { method: "GET" },
  );
  return data.municipios;
}
