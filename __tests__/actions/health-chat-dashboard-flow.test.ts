import { StatusAnimal, StatusSolicitacao, TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { completeCuidadoPlanejado } from "@/lib/actions/cuidados-planejados";
import {
  completeAdoption,
  decideAdoptionRequest,
} from "@/lib/actions/solicitacoes";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getConversationList } from "@/lib/queries/mensagens";
import { getOperationalDashboard } from "@/lib/queries/operational-dashboard";

const reference = new Date("2026-07-22T15:00:00.000Z");
const organizationId = "org-flow";
const organizationUserId = "user-org-flow";
const adopterUserId = "user-adopter-flow";
const animalId = "animal-flow";
const requestId = "request-flow";
const conversationId = "conversation-flow";

type AsyncMock = {
  mockImplementation(implementation: () => Promise<unknown>): void;
};

const careFindManyMock = prisma.cuidadoPlanejado.findMany as unknown as AsyncMock;
const healthFindManyMock = prisma.registroSaude.findMany as unknown as AsyncMock;
const requestFindUniqueMock = prisma.solicitacaoAdocao.findUnique as unknown as AsyncMock;
const animalFindManyMock = prisma.animal.findMany as unknown as AsyncMock;
const requestFindManyMock = prisma.solicitacaoAdocao.findMany as unknown as AsyncMock;
const participantFindManyMock = prisma.conversaParticipante.findMany as unknown as AsyncMock;

function responsibleSession(): Session {
  return {
    expires: new Date(Date.now() + 60_000).toISOString(),
    user: {
      id: organizationUserId,
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

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getServerSession).mockResolvedValue(responsibleSession());
});

describe("health, chat, and dashboard integrated flows", () => {
  it("recomputes the dashboard after atomic planned-care completion", async () => {
    let pending = true;
    const healthRecords: Array<{
      id: string;
      tipo: "VACINA";
      criadoEm: Date;
      animal: { id: string; nome: string };
    }> = [];

    vi.mocked(prisma.cuidadoPlanejado.findUnique).mockResolvedValue({
      id: "care-flow",
      animalId,
      tipo: "VACINA",
      status: "PENDENTE",
      animal: { organizacaoId: organizationId, acolhedorId: null },
    } as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback({
        cuidadoPlanejado: {
          updateMany: vi.fn(async () => {
            if (!pending) return { count: 0 };
            pending = false;
            return { count: 1 };
          }),
          update: vi.fn().mockResolvedValue({ id: "care-flow" }),
          upsert: vi.fn(),
        },
        registroSaude: {
          create: vi.fn(async () => {
            const record = {
              id: "health-flow",
              tipo: "VACINA" as const,
              criadoEm: reference,
              animal: { id: animalId, nome: "Luna" },
            };
            healthRecords.push(record);
            return { id: record.id };
          }),
        },
      } as never),
    );

    vi.mocked(prisma.animal.findMany).mockResolvedValue([
      {
        id: animalId,
        nome: "Luna",
        status: StatusAnimal.EM_CUIDADOS,
        criadoEm: new Date("2026-07-01T12:00:00.000Z"),
      },
    ] as never);
    vi.mocked(prisma.solicitacaoAdocao.findMany).mockResolvedValue([]);
    careFindManyMock.mockImplementation(async () =>
      (pending
        ? [{
            id: "care-flow",
            titulo: "V10",
            dataHoraPlanejada: new Date("2026-07-20T12:00:00.000Z"),
            animal: { id: animalId, nome: "Luna" },
          }]
        : []) as never,
    );
    healthFindManyMock.mockImplementation(
      async () => healthRecords as never,
    );

    const before = await getOperationalDashboard(reference);
    expect(before.indicators.overdueHealthCare.count).toBe(1);

    await expect(
      completeCuidadoPlanejado("care-flow", {
        tipoRegistro: "VACINA",
        nomeCustom: "V10",
        dataAplicacao: new Date("2026-07-22T12:00:00.000Z"),
      }),
    ).resolves.toEqual({ success: true });

    const after = await getOperationalDashboard(reference);
    expect(after.indicators.overdueHealthCare.count).toBe(0);
    expect(after.recentActivity[0]).toMatchObject({
      id: "health-flow",
      kind: "SAUDE_REGISTRADA",
    });
  });

  it("reflects approval and completion in chat and dashboard state", async () => {
    let requestStatus: StatusSolicitacao = StatusSolicitacao.EM_ANALISE;
    let animalStatus: StatusAnimal = StatusAnimal.DISPONIVEL;
    let conversationStatus: "ATIVA" | "ARQUIVADA" | null = null;

    requestFindUniqueMock.mockImplementation(async () => ({
      id: requestId,
      animalId,
      status: requestStatus,
      adotante: { usuarioId: adopterUserId },
      animal: {
        id: animalId,
        organizacaoId: organizationId,
        acolhedorId: null,
      },
    }) as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback({
        solicitacaoAdocao: {
          update: vi.fn(async ({ data }) => {
            requestStatus = data.status;
            return { id: requestId };
          }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        animal: {
          update: vi.fn(async ({ data }) => {
            animalStatus = data.status;
            return { id: animalId };
          }),
        },
        conversaAdocao: {
          upsert: vi.fn(async () => {
            conversationStatus = "ATIVA";
            return { id: conversationId };
          }),
          updateMany: vi.fn(async () => {
            conversationStatus = "ARQUIVADA";
            return { count: 1 };
          }),
        },
        conversaParticipante: {
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
      } as never),
    );

    animalFindManyMock.mockImplementation(async () => [{
      id: animalId,
      nome: "Luna",
      status: animalStatus,
      criadoEm: new Date("2026-07-01T12:00:00.000Z"),
    }] as never);
    requestFindManyMock.mockImplementation(async () => [{
      id: requestId,
      status: requestStatus,
      dataSolicitacao: new Date("2026-07-20T12:00:00.000Z"),
      dataAtualizacao: reference,
      animal: { id: animalId, nome: "Luna" },
    }] as never);
    vi.mocked(prisma.cuidadoPlanejado.findMany).mockResolvedValue([]);
    vi.mocked(prisma.registroSaude.findMany).mockResolvedValue([]);
    participantFindManyMock.mockImplementation(async () =>
      (conversationStatus
        ? [{
            conversaId: conversationId,
            ultimaLeituraEm: null,
            conversa: {
              id: conversationId,
              status: conversationStatus,
              atualizadaEm: reference,
              solicitacao: {
                id: requestId,
                animal: { id: animalId, nome: "Luna" },
              },
              participantes: [{
                usuario: {
                  adotante: { nomeCompleto: "Adotante" },
                  organizacao: null,
                  acolhedor: null,
                },
              }],
              mensagens: [],
            },
          }]
        : []) as never,
    );
    vi.mocked(prisma.mensagemAdocao.findMany).mockResolvedValue([]);

    await expect(
      decideAdoptionRequest(requestId, { decision: "APROVADA" }),
    ).resolves.toEqual({ success: true });
    const approvedDashboard = await getOperationalDashboard(reference);
    expect(approvedDashboard.adoptionFunnel.approvedOrInProcess).toBe(1);
    expect(approvedDashboard.animalStatusCounts.EM_PROCESSO_ADOCAO).toBe(1);
    await expect(getConversationList()).resolves.toEqual([
      expect.objectContaining({ id: conversationId, status: "ATIVA" }),
    ]);

    await expect(completeAdoption(requestId)).resolves.toEqual({ success: true });
    const completedDashboard = await getOperationalDashboard(reference);
    expect(completedDashboard.adoptionFunnel.completedInPeriod).toBe(1);
    expect(completedDashboard.animalStatusCounts.ADOTADO).toBe(1);
    await expect(getConversationList()).resolves.toEqual([
      expect.objectContaining({ id: conversationId, status: "ARQUIVADA" }),
    ]);
  });
});
