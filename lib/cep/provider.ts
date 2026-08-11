/**
 * Consulta de CEP.
 *
 * Este provedor NAO e fonte de coordenada. Medimos as APIs gratuitas antes de
 * decidir: o campo de coordenada delas e o centroide do municipio, nao o ponto
 * do endereco — quatro CEPs de zonas opostas de Sao Paulo devolvem a mesma
 * coordenada. Quem da a coordenada e a tabela Municipio, offline.
 *
 * O que o provedor entrega e o que so ele pode entregar: confirmar que o CEP
 * existe, preencher o endereco e devolver o CODIGO IBGE, que e a chave de
 * juncao com aquela tabela.
 */
export type EnderecoPorCep = {
  cep: string;
  logradouro: string | null;
  bairro: string | null;
  cidade: string;
  uf: string;
  /** Chave de juncao com Municipio.codigoIbge. */
  codigoIbge: string;
};

/**
 * Os tres desfechos precisam ser distinguiveis porque exigem tratamentos
 * opostos: `nao_encontrado` e erro da pessoa e aponta para o campo;
 * `indisponivel` e problema nosso e cai para a escolha manual de municipio.
 *
 * Os provedores sinalizam isso de formas incompativeis — BrasilAPI usa HTTP
 * 404, ViaCEP responde HTTP 200 com {"erro":"true"} — e normalizar essa
 * diferenca e a razao de esta interface existir.
 */
export type ResultadoCep =
  | { situacao: "encontrado"; endereco: EnderecoPorCep }
  | { situacao: "nao_encontrado" }
  | { situacao: "indisponivel"; motivo: string };

export interface ProvedorCep {
  readonly nome: string;
  buscar(cep: string): Promise<ResultadoCep>;
}

export const TIMEOUT_CEP_MS = 4000;
