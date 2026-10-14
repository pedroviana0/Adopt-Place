import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";
import { getAdopterRequests } from "@/lib/queries/adopter-requests";
import { getAdopterDashboard } from "@/lib/queries/adotante-dashboard";
import { getAdopterFavorites } from "@/lib/queries/favorites";
import { getPublicAnimalById } from "@/lib/queries/public-animal";

// Spec 009 (RF-015, D7, Clarification 1): dados de lar temporario e o
// indicador de tratamento so existem na gestao da ONG dona. Nenhuma consulta
// que alimenta visitante ou adotante pode pedir esses campos, e nenhuma pode
// trazer o animal inteiro (include ou `animal: true`), porque um campo novo no
// model vazaria sem ninguem perceber.

const FORBIDDEN = ["situacaoLT", "larTemporario", "larTemporarioId", "emTratamento"];

const PUBLIC_AND_ADOPTER_QUERIES = [
  "animal-showcase",
  "public-animal",
  "feels",
  "favorites",
  "public-profiles",
  "adopter-requests",
  "adotante-dashboard",
  "mensagens",
];

function source(name: string): string {
  return readFileSync(join(process.cwd(), "lib", "queries", `${name}.ts`), "utf8");
}

function expectNoFosterData(serialized: string) {
  for (const field of FORBIDDEN) {
    expect(serialized).not.toContain(field);
  }
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("privacidade de LT nas consultas publicas e de adotante (spec 009)", () => {
  it.each(PUBLIC_AND_ADOPTER_QUERIES)(
    "%s nao cita campos de LT nem tratamento",
    (name) => {
      expectNoFosterData(source(name));
    },
  );

  it.each(PUBLIC_AND_ADOPTER_QUERIES)(
    "%s usa select explicito, sem include nem relacao de animal inteira",
    (name) => {
      const code = source(name);
      expect(code).not.toMatch(/\binclude\s*:/);
      expect(code).not.toMatch(/\banimal(?:is)?\s*:\s*true\b/);
    },
  );

  it("detalhe publico do animal pede so campos selecionados", async () => {
    vi.mocked(prisma.animal.findUnique).mockResolvedValue(null);

    await getPublicAnimalById("cm00000000000000000000001");

    const args = vi.mocked(prisma.animal.findUnique).mock.calls[0]?.[0];
    expect(args).toHaveProperty("select");
    expect(args).not.toHaveProperty("include");
    expectNoFosterData(JSON.stringify(args));
  });

  it("favoritos do adotante pedem so campos selecionados do animal", async () => {
    vi.mocked(prisma.favorito.findMany).mockResolvedValue([]);

    await getAdopterFavorites("cm00000000000000000000002");

    const args = vi.mocked(prisma.favorito.findMany).mock.calls[0]?.[0];
    expect(args).toHaveProperty("select.animal.select");
    expectNoFosterData(JSON.stringify(args));
  });

  it("solicitacoes do adotante pedem so campos selecionados do animal", async () => {
    vi.mocked(prisma.solicitacaoAdocao.findMany).mockResolvedValue([]);

    await getAdopterRequests("cm00000000000000000000002");

    const args = vi.mocked(prisma.solicitacaoAdocao.findMany).mock.calls[0]?.[0];
    expect(args).toHaveProperty("select.animal.select");
    expectNoFosterData(JSON.stringify(args));
  });

  it("painel do adotante nao pede dados de LT", async () => {
    vi.mocked(prisma.adotante.findUnique).mockResolvedValue(null);

    await getAdopterDashboard("cm00000000000000000000002");

    const args = vi.mocked(prisma.adotante.findUnique).mock.calls[0]?.[0];
    expect(args).toHaveProperty("select");
    expectNoFosterData(JSON.stringify(args));
  });
});
