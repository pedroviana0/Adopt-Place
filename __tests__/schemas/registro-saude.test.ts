import { describe, expect, it } from "vitest";

import { registroSaudeSchema } from "@/lib/schemas/registro-saude";

const dataRegistro = new Date("2026-07-20T12:00:00.000Z");

describe("registroSaudeSchema", () => {
  it.each([
    {
      tipoRegistro: "MEDICAMENTO_TRATAMENTO",
      medicamentoTratamento: "Antibiotico por sete dias",
      titulo: "Tratamento pos-operatorio",
      dataAplicacao: dataRegistro,
    },
    {
      tipoRegistro: "PROCEDIMENTO",
      procedimento: "Castracao",
      titulo: "Cirurgia de castracao",
      dataAplicacao: dataRegistro,
    },
  ])("accepts the new completed health category $tipoRegistro", (input) => {
    expect(registroSaudeSchema.safeParse(input).success).toBe(true);
  });

  it("keeps CONSULTA outside completed health history", () => {
    const result = registroSaudeSchema.safeParse({
      tipoRegistro: "CONSULTA",
      titulo: "Retorno veterinario",
      dataAplicacao: dataRegistro,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a next date that is not after completion", () => {
    const result = registroSaudeSchema.safeParse({
      tipoRegistro: "PROCEDIMENTO",
      procedimento: "Curativo",
      dataAplicacao: dataRegistro,
      dataProxima: dataRegistro,
    });

    expect(result.success).toBe(false);
  });
});
