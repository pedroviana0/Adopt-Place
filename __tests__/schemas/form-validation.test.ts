import { describe, expect, it } from "vitest";

import { adopterScreeningSchema, adopterRegistrationSchema } from "@/lib/schemas/adotante";
import { cnpjSchema, cpfSchema, personNameSchema, phoneSchema } from "@/lib/schemas/common";
import {
  cnpjSchema as frontendCnpjSchema,
  cpfSchema as frontendCpfSchema,
  phoneSchema as frontendPhoneSchema,
} from "../../frontend/src/lib/schemas/common";
import { triagemSchema as frontendScreeningSchema } from "../../frontend/src/lib/schemas/triagem";

describe("shared form validation", () => {
  it.each([
    ["529.982.247-25", "52998224725"],
    ["168.995.350-09", "16899535009"],
  ])("normalizes a valid CPF", (input, normalized) => {
    expect(cpfSchema.parse(input)).toBe(normalized);
  });

  it.each(["12345678900", "111.111.111-11", "123", "52998224724"])(
    "rejects an invalid CPF: %s",
    (input) => expect(cpfSchema.safeParse(input).success).toBe(false),
  );

  it("normalizes a valid CNPJ and rejects repeated digits", () => {
    expect(cnpjSchema.parse("04.252.011/0001-10")).toBe("04252011000110");
    expect(cnpjSchema.safeParse("11.111.111/1111-11").success).toBe(false);
  });

  it("keeps Brazilian document and phone rules aligned with the frontend", () => {
    expect(frontendCpfSchema.parse("529.982.247-25")).toBe(cpfSchema.parse("529.982.247-25"));
    expect(frontendCnpjSchema.parse("04.252.011/0001-10")).toBe(cnpjSchema.parse("04.252.011/0001-10"));
    expect(frontendPhoneSchema.parse("(24) 99999-1234")).toBe(phoneSchema.parse("(24) 99999-1234"));
  });

  it("uses a Portuguese message for the desired animal type on the frontend", () => {
    const result = frontendScreeningSchema.safeParse({ tipoAnimalDesejado: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.find((issue) => issue.path[0] === "tipoAnimalDesejado")?.message)
        .toBe("O tipo de animal desejado é obrigatório.");
    }
  });

  it.each(["(24) 99999-1234", "24 3333-1234"])("accepts a plausible Brazilian phone", (input) => {
    expect(phoneSchema.safeParse(input).success).toBe(true);
  });

  it.each(["123", "000000000000000", "24 123"])("rejects an implausible phone", (input) => {
    expect(phoneSchema.safeParse(input).success).toBe(false);
  });

  it.each(["João d'Ávila", "Ana-Luísa", "Ítalo"])("accepts a Brazilian name", (input) => {
    expect(personNameSchema.safeParse(input).success).toBe(true);
  });

  it.each(["123", "***", " A "])("rejects content without the appearance of a name", (input) => {
    expect(personNameSchema.safeParse(input).success).toBe(false);
  });

  it("rejects extra registration properties", () => {
    const result = adopterRegistrationSchema.safeParse({ papel: "ADMIN" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.code === "unrecognized_keys")).toBe(true);
  });

  it("reports conditional screening details on the corresponding fields", () => {
    const result = adopterScreeningSchema.safeParse({
      motivoAdocao: "Quero oferecer um lar responsável.", tipoAnimalDesejado: "Cachorro",
      podeArcarCustosVet: true, adocaoParaPresente: true, tipoMoradia: "CASA",
      moradiaPropria: true, numAdultosCasa: 2, temCriancas: true,
      todosConordamAdocao: true, janelasTeladas: true, acessoRua: "Somente com guia",
      murosSeguros: true, horasSozinho: "4 horas", responsavelViagem: "Minha irmã",
      alergicosNaCasa: true, planoMudanca: "Levar o animal", historicoDevolucao: "Nunca ocorreu",
      historicoPercaDescuido: "Nunca ocorreu", cienteLongevidade: true,
      permiteVisitaProtetor: true, ciendeNaoRepassar: true, teveAnimaisAntes: true,
      temOutrosAnimais: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path[0]);
      expect(fields).toEqual(expect.arrayContaining([
        "adocaoParaPresenteDetalhe", "criancasFaixaEtaria", "alergicosNaCasaDetalhe",
        "animaisAnterioresDescricao", "outrosAnimaisDescricao",
      ]));
    }
  });
});
