import { PrismaClient } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";

import { normalizarNomeMunicipio } from "@/lib/municipios";

const database = new PrismaClient();

afterAll(async () => {
  await database.$disconnect();
});

describe("seed da busca pública de organizações", () => {
  it("encontra razão social acentuada usando termo sem acento", async () => {
    const term = normalizarNomeMunicipio("  ORGANIZACAO  ");
    const organization = await database.organizacao.findFirst({
      where: { razaoSocialNormalizada: { contains: term } },
      select: { razaoSocial: true, razaoSocialNormalizada: true },
    });

    expect(organization?.razaoSocial).toContain("Organização");
    expect(organization?.razaoSocialNormalizada).toContain("organizacao");
  });
});
