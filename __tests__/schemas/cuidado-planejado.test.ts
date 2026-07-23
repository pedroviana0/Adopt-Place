import { describe, expect, it } from "vitest";

import {
  agendaFilterSchema,
  concluirCuidadoSchema,
  consultaPlanejadaSchema,
  reagendarCuidadoSchema,
} from "@/lib/schemas/cuidado-planejado";

const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

describe("planned care schemas", () => {
  it("accepts a future CONSULTA agenda event", () => {
    expect(
      consultaPlanejadaSchema.safeParse({
        animalId: "cm00000000000000000000001",
        dataHoraPlanejada: futureDate,
        titulo: "Consulta de retorno",
        observacoes: "Levar exames",
        localProfissional: "Clinica Central",
      }).success,
    ).toBe(true);
  });

  it("requires a valid date when rescheduling", () => {
    expect(
      reagendarCuidadoSchema.safeParse({ dataHoraPlanejada: "invalida" }).success,
    ).toBe(false);
  });

  it("accepts completion data only for a completed health category", () => {
    expect(
      concluirCuidadoSchema.safeParse({
        tipoRegistro: "PROCEDIMENTO",
        procedimento: "Curativo",
        dataAplicacao: new Date("2026-07-20T12:00:00.000Z"),
      }).success,
    ).toBe(true);
  });

  it("parses supported date-derived agenda filters", () => {
    expect(
      agendaFilterSchema.safeParse({
        tipo: "CONSULTA",
        situacao: "PROXIMOS_7_DIAS",
        from: "2026-07-20",
        to: "2026-07-27",
      }).success,
    ).toBe(true);
  });
});
