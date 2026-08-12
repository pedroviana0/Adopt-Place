import { describe, expect, it } from "vitest";

import {
  formatarCep,
  normalizarCep,
  normalizarNomeMunicipio,
} from "@/lib/municipios";

describe("normalizarNomeMunicipio", () => {
  it("remove acento, caixa e espaco sobrando", () => {
    expect(normalizarNomeMunicipio("São Paulo")).toBe("sao paulo");
    expect(normalizarNomeMunicipio("SÃO  PAULO ")).toBe("sao paulo");
    expect(normalizarNomeMunicipio("  são paulo")).toBe("sao paulo");
  });

  it("cobre os acentos que aparecem em nome de municipio", () => {
    expect(normalizarNomeMunicipio("Goiânia")).toBe("goiania");
    expect(normalizarNomeMunicipio("Açu")).toBe("acu");
    expect(normalizarNomeMunicipio("Brasília")).toBe("brasilia");
    expect(normalizarNomeMunicipio("Vitória")).toBe("vitoria");
    expect(normalizarNomeMunicipio("Óbidos")).toBe("obidos");
    expect(normalizarNomeMunicipio("Içara")).toBe("icara");
    expect(normalizarNomeMunicipio("Ubatuba")).toBe("ubatuba");
  });

  it("casa grafias diferentes do mesmo municipio", () => {
    expect(normalizarNomeMunicipio("VOLTA REDONDA")).toBe(
      normalizarNomeMunicipio("Volta Redonda"),
    );
    expect(normalizarNomeMunicipio("Santa Bárbara d'Oeste")).toBe(
      normalizarNomeMunicipio("SANTA BARBARA D'OESTE"),
    );
  });

  it("e idempotente, entao pode rodar de novo sobre o proprio resultado", () => {
    const uma = normalizarNomeMunicipio("São Gonçalo do Amarante");
    expect(normalizarNomeMunicipio(uma)).toBe(uma);
  });

  it("normaliza razao social com a mesma regra compartilhada", () => {
    expect(normalizarNomeMunicipio("  PROTEÇÃO   À VIDA  ")).toBe(
      "protecao a vida",
    );
  });
});

describe("normalizarCep", () => {
  it("aceita CEP com e sem mascara", () => {
    expect(normalizarCep("27255-000")).toBe("27255000");
    expect(normalizarCep("27255000")).toBe("27255000");
    expect(normalizarCep(" 27.255-000 ")).toBe("27255000");
  });

  it("recusa o que nao tem oito digitos", () => {
    expect(normalizarCep("123")).toBeNull();
    expect(normalizarCep("272550001")).toBeNull();
    expect(normalizarCep("")).toBeNull();
    expect(normalizarCep("abcdefgh")).toBeNull();
  });
});

describe("formatarCep", () => {
  it("aplica a mascara", () => {
    expect(formatarCep("27255000")).toBe("27255-000");
  });

  it("devolve a entrada intacta quando nao da para formatar", () => {
    expect(formatarCep("123")).toBe("123");
  });
});
