import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProvedorBrasilApi } from "@/lib/cep/brasilapi";
import { provedorCep } from "@/lib/cep";
import { ProvedorViaCep } from "@/lib/cep/viacep";

const cep = "27255000";

function respostaJson(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const brasilApiOk = {
  cep: "27255000",
  state: "RJ",
  city: "Volta Redonda",
  neighborhood: "Laranjal",
  street: "Rua Cem",
  ibge: { city: "3306305", state: "33" },
  location: { coordinates: { longitude: "-44.0996", latitude: "-22.5202" } },
};

const viaCepOk = {
  cep: "27255-000",
  logradouro: "Rua Cem",
  bairro: "Laranjal",
  localidade: "Volta Redonda",
  uf: "RJ",
  ibge: "3306305",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  delete process.env.CEP_PROVIDER;
});

describe("ProvedorBrasilApi", () => {
  it("extrai endereco e codigo IBGE de uma resposta valida", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respostaJson(brasilApiOk)));

    const resultado = await new ProvedorBrasilApi().buscar(cep);

    expect(resultado).toEqual({
      situacao: "encontrado",
      endereco: {
        cep,
        logradouro: "Rua Cem",
        bairro: "Laranjal",
        cidade: "Volta Redonda",
        uf: "RJ",
        codigoIbge: "3306305",
      },
    });
  });

  it("trata 404 como CEP inexistente, nao como servico fora do ar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respostaJson({}, 404)));

    expect(await new ProvedorBrasilApi().buscar(cep)).toEqual({
      situacao: "nao_encontrado",
    });
  });

  it("trata 400 como CEP malformado", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respostaJson({}, 400)));

    expect(await new ProvedorBrasilApi().buscar(cep)).toEqual({
      situacao: "nao_encontrado",
    });
  });

  it("trata 5xx como indisponivel", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respostaJson({}, 503)));

    const resultado = await new ProvedorBrasilApi().buscar(cep);
    expect(resultado.situacao).toBe("indisponivel");
  });

  it("trata queda de rede como indisponivel, sem estourar excecao", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    const resultado = await new ProvedorBrasilApi().buscar(cep);
    expect(resultado).toEqual({
      situacao: "indisponivel",
      motivo: "ECONNREFUSED",
    });
  });

  it("recusa resposta 200 sem codigo IBGE, porque nao da para achar o municipio", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        respostaJson({ city: "Volta Redonda", state: "RJ" }),
      ),
    );

    const resultado = await new ProvedorBrasilApi().buscar(cep);
    expect(resultado.situacao).toBe("indisponivel");
  });
});

describe("ProvedorViaCep", () => {
  it("extrai endereco e codigo IBGE de uma resposta valida", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respostaJson(viaCepOk)));

    expect(await new ProvedorViaCep().buscar(cep)).toEqual({
      situacao: "encontrado",
      endereco: {
        cep,
        logradouro: "Rua Cem",
        bairro: "Laranjal",
        cidade: "Volta Redonda",
        uf: "RJ",
        codigoIbge: "3306305",
      },
    });
  });

  it("entende HTTP 200 com erro no corpo como CEP inexistente", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(respostaJson({ erro: "true" })),
    );

    expect(await new ProvedorViaCep().buscar(cep)).toEqual({
      situacao: "nao_encontrado",
    });
  });

  it("aceita o campo erro como booleano tambem", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(respostaJson({ erro: true })),
    );

    expect(await new ProvedorViaCep().buscar(cep)).toEqual({
      situacao: "nao_encontrado",
    });
  });

  it("trata queda de rede como indisponivel", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));

    expect((await new ProvedorViaCep().buscar(cep)).situacao).toBe("indisponivel");
  });
});

describe("selecao de provedor", () => {
  it("usa BrasilAPI por padrao", () => {
    expect(provedorCep().nome).toBe("brasilapi");
  });

  it("respeita CEP_PROVIDER", () => {
    process.env.CEP_PROVIDER = "viacep";
    expect(provedorCep().nome).toBe("viacep");
  });

  it("ignora caixa e espaco na variavel", () => {
    process.env.CEP_PROVIDER = "  ViaCEP  ";
    expect(provedorCep().nome).toBe("viacep");
  });

  it("falha alto quando o provedor configurado nao existe", () => {
    process.env.CEP_PROVIDER = "correios";
    expect(() => provedorCep()).toThrow(/desconhecido/);
  });
});
