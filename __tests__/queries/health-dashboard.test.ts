import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getServerSession } from "@/lib/auth";
import {
  APPLICATION_TIME_ZONE,
  classifyHealthDate,
  getApplicationDayBounds,
  getUpcomingRange,
  isInNext30Days,
  isInNext7Days,
  isOverdue,
  isToday,
} from "@/lib/date-utils";
import {
  getAnimalHealthTimeline,
  getHealthOverview,
} from "@/lib/queries/health-dashboard";
import { prisma } from "@/lib/prisma";

const organizationId = "cm00000000000000000000101";

function responsibleSession(): Session {
  return {
    expires: new Date(Date.now() + 60_000).toISOString(),
    user: {
      id: "cm00000000000000000000102",
      email: "org@example.com",
      name: "Organizacao",
      image: null,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      ativo: true,
      adotanteId: null,
      organizacaoId: organizationId,
      acolhedorId: null,
    },
  };
}

const mockedGetServerSession = vi.mocked(getServerSession);
const findPlannedCare = prisma.cuidadoPlanejado.findMany as unknown as {
  mockResolvedValue(value: Array<{
    id: string;
    animalId: string;
    tipo: "VACINA" | "CONSULTA";
    status: "PENDENTE";
    dataHoraPlanejada: Date;
    titulo: string;
    observacoes: string | null;
    localProfissional: string | null;
    origemRegistroSaudeId: string | null;
    animal: { id: string; nome: string };
  }>): void;
};
const findOwnedAnimals = prisma.animal.findMany as unknown as {
  mockResolvedValue(value: Array<{
    id: string;
    nome: string;
    registrosSaude: Array<{
      tipo: "TESTE_DOENCA";
      resultado: "POSITIVO";
      nomeDoenca: string | null;
      dataRegistro: Date;
    }>;
  }>): void;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("health date grouping", () => {
  const reference = new Date("2026-07-22T02:30:00.000Z");

  it("uses the application timezone across a UTC date boundary", () => {
    expect(APPLICATION_TIME_ZONE).toBe("America/Sao_Paulo");
    expect(isToday(new Date("2026-07-22T01:00:00.000Z"), reference)).toBe(true);
    expect(isOverdue(new Date("2026-07-21T02:59:59.000Z"), reference)).toBe(true);
  });

  it("classifies next 7 and next 30 day boundaries deterministically", () => {
    const next7Boundary = new Date("2026-07-29T02:00:00.000Z");
    const next30Only = new Date("2026-07-30T12:00:00.000Z");

    expect(classifyHealthDate(next7Boundary, reference)).toBe("PROXIMOS_7_DIAS");
    expect(classifyHealthDate(next30Only, reference)).toBe("PROXIMOS_30_DIAS");
    expect(isInNext7Days(next7Boundary, reference)).toBe(true);
    expect(isInNext30Days(next7Boundary, reference)).toBe(true);
    expect(isInNext7Days(next30Only, reference)).toBe(false);
    expect(isInNext30Days(next30Only, reference)).toBe(true);
  });

  it("returns query boundaries at application midnight", () => {
    expect(getApplicationDayBounds(reference)).toEqual({
      start: new Date("2026-07-21T03:00:00.000Z"),
      endExclusive: new Date("2026-07-22T03:00:00.000Z"),
    });
    expect(getUpcomingRange(7, reference)).toEqual({
      start: new Date("2026-07-22T03:00:00.000Z"),
      endExclusive: new Date("2026-07-29T03:00:00.000Z"),
    });
  });
});

describe("getHealthOverview", () => {
  it("groups owned care and highlights no-history animals and positive tests", async () => {
    const reference = new Date("2026-07-22T15:00:00.000Z");
    mockedGetServerSession.mockResolvedValue(responsibleSession());
    findPlannedCare.mockResolvedValue([
      {
        id: "overdue",
        animalId: "animal-1",
        tipo: "VACINA",
        status: "PENDENTE",
        dataHoraPlanejada: new Date("2026-07-20T15:00:00.000Z"),
        titulo: "V10",
        observacoes: null,
        localProfissional: null,
        origemRegistroSaudeId: "record-1",
        animal: { id: "animal-1", nome: "Luna" },
      },
      {
        id: "today",
        animalId: "animal-2",
        tipo: "CONSULTA",
        status: "PENDENTE",
        dataHoraPlanejada: new Date("2026-07-22T18:00:00.000Z"),
        titulo: "Retorno",
        observacoes: null,
        localProfissional: null,
        origemRegistroSaudeId: null,
        animal: { id: "animal-2", nome: "Nina" },
      },
    ]);
    findOwnedAnimals.mockResolvedValue([
      { id: "animal-2", nome: "Nina", registrosSaude: [] },
      {
        id: "animal-3",
        nome: "Thor",
        registrosSaude: [
          {
            tipo: "TESTE_DOENCA",
            resultado: "POSITIVO",
            nomeDoenca: "Leishmaniose",
            dataRegistro: new Date("2026-07-18T12:00:00.000Z"),
          },
        ],
      },
    ]);

    const result = await getHealthOverview(reference);

    expect(result.groups.overdue.map((item) => item.id)).toEqual(["overdue"]);
    expect(result.groups.today.map((item) => item.id)).toEqual(["today"]);
    expect(result.animalsWithoutHistory).toEqual([
      { id: "animal-2", nome: "Nina", href: "/dashboard/animais/animal-2/saude" },
    ]);
    expect(result.positiveTests[0]).toMatchObject({
      animalId: "animal-3",
      animalNome: "Thor",
      disease: "Leishmaniose",
    });

    const careQuery = vi.mocked(prisma.cuidadoPlanejado.findMany).mock.calls[0]?.[0];
    const animalQuery = vi.mocked(prisma.animal.findMany).mock.calls[0]?.[0];
    expect(JSON.stringify(careQuery)).toContain(organizationId);
    expect(JSON.stringify(animalQuery)).toContain(organizationId);
  });
});

describe("getAnimalHealthTimeline", () => {
  it("returns only completed health categories for an owned animal", async () => {
    mockedGetServerSession.mockResolvedValue(responsibleSession());
    vi.mocked(prisma.animal.findFirst).mockResolvedValue({ id: "animal-1" } as never);
    vi.mocked(prisma.registroSaude.findMany).mockResolvedValue([]);

    await expect(getAnimalHealthTimeline("animal-1")).resolves.toEqual([]);

    const ownerQuery = vi.mocked(prisma.animal.findFirst).mock.calls[0]?.[0];
    const timelineQuery = vi.mocked(prisma.registroSaude.findMany).mock.calls[0]?.[0];
    expect(JSON.stringify(ownerQuery)).toContain(organizationId);
    expect(timelineQuery?.where?.tipo).toEqual({
      in: [
        "VACINA",
        "CONTROLE_PARASITAS",
        "TESTE_DOENCA",
        "MEDICAMENTO_TRATAMENTO",
        "PROCEDIMENTO",
      ],
    });
    expect(JSON.stringify(timelineQuery)).not.toContain("CONSULTA");
  });
});
