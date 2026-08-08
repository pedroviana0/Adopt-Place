import {
  TIMEOUT_CEP_MS,
  type ProvedorCep,
  type ResultadoCep,
} from "@/lib/cep/provider";

type RespostaViaCep = {
  erro?: boolean | string;
  logradouro?: string | null;
  bairro?: string | null;
  localidade?: string;
  uf?: string;
  ibge?: string;
};

/**
 * ViaCEP. Sinaliza CEP inexistente com HTTP 200 e {"erro":"true"} no corpo —
 * o oposto da BrasilAPI, que usa 404. Tratar so o status aqui faria um CEP
 * invalido virar "servico fora do ar".
 *
 * O campo `erro` ja veio como string "true" e como booleano true em versoes
 * diferentes da API, entao ambos contam.
 */
export class ProvedorViaCep implements ProvedorCep {
  readonly nome = "viacep";

  constructor(
    private readonly baseUrl = "https://viacep.com.br/ws",
    private readonly timeoutMs = TIMEOUT_CEP_MS,
  ) {}

  async buscar(cep: string): Promise<ResultadoCep> {
    let resposta: Response;
    try {
      resposta = await fetch(`${this.baseUrl}/${cep}/json/`, {
        signal: AbortSignal.timeout(this.timeoutMs),
        headers: { accept: "application/json" },
      });
    } catch (erro) {
      return {
        situacao: "indisponivel",
        motivo: erro instanceof Error ? erro.message : "falha de rede",
      };
    }

    if (resposta.status === 400) {
      return { situacao: "nao_encontrado" };
    }
    if (!resposta.ok) {
      return { situacao: "indisponivel", motivo: `HTTP ${resposta.status}` };
    }

    let corpo: RespostaViaCep;
    try {
      corpo = (await resposta.json()) as RespostaViaCep;
    } catch {
      return { situacao: "indisponivel", motivo: "resposta ilegivel" };
    }

    if (corpo.erro === true || corpo.erro === "true") {
      return { situacao: "nao_encontrado" };
    }

    if (!corpo.localidade || !corpo.uf || !corpo.ibge) {
      return { situacao: "indisponivel", motivo: "resposta sem codigo IBGE" };
    }

    return {
      situacao: "encontrado",
      endereco: {
        cep,
        logradouro: corpo.logradouro?.trim() || null,
        bairro: corpo.bairro?.trim() || null,
        cidade: corpo.localidade,
        uf: corpo.uf,
        codigoIbge: corpo.ibge,
      },
    };
  }
}
