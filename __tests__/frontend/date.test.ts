import { describe, expect, it } from "vitest";

import { pastOrTodayDateSchema } from "@/lib/schemas/common";
import { classifyHealthDate } from "@/lib/date-utils";
import {
  agoraLocal,
  dataHoraInputParaIso,
  dataInputParaIso,
  formatarData,
  formatarDataExtenso,
  formatarDataHora,
  hojeLocal,
} from "../../frontend/src/lib/date";

// 13/10/2026 às 22h em Brasília = 14/10/2026 01h UTC: o dia já virou em UTC.
const vinteEDuasHoras = new Date("2026-10-14T01:00:00.000Z");

describe("datas do painel no fuso de Brasília (spec 010)", () => {
  it("'hoje' às 22h continua sendo o dia de Brasília, não o de UTC", () => {
    expect(new Date(vinteEDuasHoras).toISOString().slice(0, 10)).toBe("2026-10-14");
    expect(hojeLocal(vinteEDuasHoras)).toBe("2026-10-13");
  });

  it("o min do datetime-local às 22h é o horário local", () => {
    expect(agoraLocal(vinteEDuasHoras)).toBe("2026-10-13T22:00");
    expect(agoraLocal(new Date("2026-10-14T01:30:59.000Z"))).toBe("2026-10-13T22:30");
  });

  it("data digitada não muda de dia ao salvar e exibir", () => {
    const iso = dataInputParaIso("2026-10-13");
    expect(iso).toBe("2026-10-13T03:00:00.000Z");
    expect(formatarData(iso)).toBe("13/10/2026");
    expect(classifyHealthDate(new Date(iso), vinteEDuasHoras)).toBe("HOJE");
  });

  it("data de hoje registrada às 22h não é vista como futura pelo backend", () => {
    const iso = dataInputParaIso(hojeLocal(vinteEDuasHoras));
    expect(new Date(iso).getTime()).toBeLessThanOrEqual(vinteEDuasHoras.getTime());
    // Logo depois da meia-noite local também precisa passar (meio-dia falharia).
    const madrugada = new Date("2026-10-13T03:05:00.000Z");
    const isoMadrugada = dataInputParaIso(hojeLocal(madrugada));
    expect(new Date(isoMadrugada).getTime()).toBeLessThanOrEqual(madrugada.getTime());
    expect(pastOrTodayDateSchema.safeParse(new Date(iso)).success).toBe(true);
  });

  it("data e hora digitadas são o instante de Brasília, ida e volta", () => {
    const iso = dataHoraInputParaIso("2026-10-13T23:30");
    expect(iso).toBe("2026-10-14T02:30:00.000Z");
    expect(formatarDataHora(iso)).toBe("13/10/2026 às 23:30");
    expect(classifyHealthDate(new Date(iso), vinteEDuasHoras)).toBe("HOJE");
  });

  it("o min gerado é aceito de volta pelo conversor", () => {
    const min = agoraLocal(vinteEDuasHoras);
    expect(dataHoraInputParaIso(min)).toBe(vinteEDuasHoras.toISOString());
  });

  it("amanhã cedo é 'próximos 7 dias', não 'hoje'", () => {
    const iso = dataHoraInputParaIso("2026-10-14T07:00");
    expect(classifyHealthDate(new Date(iso), vinteEDuasHoras)).toBe("PROXIMOS_7_DIAS");
  });

  it("formata por extenso no fuso de Brasília", () => {
    expect(formatarDataExtenso("2026-10-14T01:00:00.000Z")).toBe("13 de outubro de 2026");
  });

  it("recusa formatos que não vêm dos inputs", () => {
    expect(() => dataInputParaIso("")).toThrow(RangeError);
    expect(() => dataInputParaIso("13/10/2026")).toThrow(RangeError);
    expect(() => dataHoraInputParaIso("2026-10-13")).toThrow(RangeError);
  });
});
