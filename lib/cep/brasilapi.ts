import {
  TIMEOUT_CEP_MS,
  type ProvedorCep,
  type ResultadoCep,
} from "@/lib/cep/provider";

type RespostaBrasilApi = {
  cep?: string;
  street?: string | null;
  neighborhood?: string | null;
  city?: string;
  state?: string;
  ibge?: { city?: string };
};

/**
 * BrasilAPI. Sinaliza CEP inexistente com HTTP 404 e CEP malformado com 400.
 * Devolve o codigo IBGE em `ibge.city`.
 */
export class ProvedorBrasilApi implements ProvedorCep {
  readonly nome = "brasilapi";

  constructor(
    private readonly baseUrl = "https://brasilapi.com.br/api/cep/v2",
    private readonly timeoutMs = TIMEOUT_CEP_MS,
  ) {}

  async buscar(cep: string): Promise<ResultadoCep> {
    let resposta: Response;
    try {
      resposta = await fetch(`${this.baseUrl}/${cep}`, {
        signal: AbortSignal.timeout(this.timeoutMs),
        headers: { accept: "application/json" },
      });
    } catch (erro) {
      return {
        situacao: "indisponivel",
        motivo: erro instanceof Error ? erro.message : "falha de rede",
      };
    }

    if (resposta.status === 404 || resposta.status === 400) {
      return { situacao: "nao_encontrado" };
    }
    if (!resposta.ok) {
      return { situacao: "indisponivel", motivo: `HTTP ${resposta.status}` };
    }

    let corpo: RespostaBrasilApi;
    try {
      corpo = (await resposta.json()) as RespostaBrasilApi;
    } catch {
      return { situacao: "indisponivel", motivo: "resposta ilegivel" };
    }

    const codigoIbge = corpo.ibge?.city;
    if (!corpo.city || !corpo.state || !codigoIbge) {
      // Sem codigo IBGE nao da para achar o municipio, entao a resposta e
      // inutil para o nosso proposito, mesmo tendo vindo com HTTP 200.
      return { situacao: "indisponivel", motivo: "resposta sem codigo IBGE" };
    }

    return {
      situacao: "encontrado",
      endereco: {
        cep,
        logradouro: corpo.street?.trim() || null,
        bairro: corpo.neighborhood?.trim() || null,
        cidade: corpo.city,
        uf: corpo.state,
        codigoIbge,
      },
    };
  }
}
