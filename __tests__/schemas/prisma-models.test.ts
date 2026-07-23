import {
  PrismaClient,
  TipoCuidadoPlanejado,
  TipoRegistroSaude,
} from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe("feature 002 Prisma surface", () => {
  it("exposes additive model delegates", () => {
    expect(prisma.cuidadoPlanejado).toBeDefined();
    expect(prisma.documentoSaude).toBeDefined();
    expect(prisma.conversaAdocao).toBeDefined();
    expect(prisma.conversaParticipante).toBeDefined();
    expect(prisma.mensagemAdocao).toBeDefined();
  });

  it("keeps CONSULTA outside health history and inside planned care", () => {
    expect(Object.values(TipoRegistroSaude)).not.toContain("CONSULTA");
    expect(TipoRegistroSaude.MEDICAMENTO_TRATAMENTO).toBe(
      "MEDICAMENTO_TRATAMENTO",
    );
    expect(TipoRegistroSaude.PROCEDIMENTO).toBe("PROCEDIMENTO");
    expect(TipoCuidadoPlanejado.CONSULTA).toBe("CONSULTA");
  });
});
