import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOperationalDashboard } from "@/lib/queries/operational-dashboard";

const organizationId = "cm00000000000000000000701";
const reference = new Date("2026-07-22T15:00:00.000Z");

function session(): Session {
  return {
    expires: new Date(Date.now() + 60_000).toISOString(),
    user: {
      id: "cm00000000000000000000702",
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

function mockSourceTruth() {
  vi.mocked(prisma.animal.findMany).mockResolvedValue([
    { id: "a1", nome: "Luna", status: "DISPONIVEL", criadoEm: new Date("2026-07-20T10:00:00Z") },
    { id: "a2", nome: "Nina", status: "EM_CUIDADOS", criadoEm: new Date("2026-07-18T10:00:00Z") },
    { id: "a3", nome: "Thor", status: "EM_PROCESSO_ADOCAO", criadoEm: new Date("2026-07-17T10:00:00Z") },
  ] as never);
  vi.mocked(prisma.solicitacaoAdocao.findMany).mockResolvedValue([
    { id: "r1", status: "EM_ANALISE", dataSolicitacao: new Date("2026-07-21T10:00:00Z"), dataAtualizacao: new Date("2026-07-21T10:00:00Z"), animal: { id: "a1", nome: "Luna" } },
    { id: "r2", status: "APROVADA", dataSolicitacao: new Date("2026-07-19T10:00:00Z"), dataAtualizacao: new Date("2026-07-22T10:00:00Z"), animal: { id: "a3", nome: "Thor" } },
    { id: "r3", status: "CONCLUIDA", dataSolicitacao: new Date("2026-07-01T10:00:00Z"), dataAtualizacao: new Date("2026-07-20T10:00:00Z"), animal: { id: "a3", nome: "Thor" } },
  ] as never);
  vi.mocked(prisma.cuidadoPlanejado.findMany).mockResolvedValue([
    { id: "c1", titulo: "V10", dataHoraPlanejada: new Date("2026-07-20T12:00:00Z"), animal: { id: "a1", nome: "Luna" } },
    { id: "c2", titulo: "Retorno", dataHoraPlanejada: new Date("2026-07-22T18:00:00Z"), animal: { id: "a2", nome: "Nina" } },
    { id: "c3", titulo: "Vermifugo", dataHoraPlanejada: new Date("2026-07-25T12:00:00Z"), animal: { id: "a2", nome: "Nina" } },
  ] as never);
  vi.mocked(prisma.registroSaude.findMany).mockResolvedValue([
    { id: "h1", tipo: "VACINA", criadoEm: new Date("2026-07-22T11:00:00Z"), animal: { id: "a1", nome: "Luna" } },
  ] as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getServerSession).mockResolvedValue(session());
  mockSourceTruth();
});

describe("getOperationalDashboard", () => {
  it("computes actionable indicators, priority order, funnel, status, and activity", async () => {
    const result = await getOperationalDashboard(reference);

    expect(result.indicators.availableAnimals).toEqual({ count: 1, href: "/dashboard/animais?status=DISPONIVEL" });
    expect(result.indicators.overdueHealthCare).toEqual({ count: 1, href: "/dashboard/saude/agenda?situacao=ATRASADO" });
    expect(result.indicators.next7DaysHealthCare.count).toBe(1);
    expect(result.priorityItems.map((item) => item.kind)).toEqual([
      "SAUDE_ATRASADA",
      "SAUDE_HOJE",
      "SOLICITACAO_ANALISE",
      "ADOCAO_APROVADA_CONCLUSAO",
    ]);
    expect(result.adoptionFunnel).toEqual({ inAnalysis: 1, approvedOrInProcess: 1, completedInPeriod: 1 });
    expect(result.animalStatusCounts).toMatchObject({ DISPONIVEL: 1, EM_CUIDADOS: 1, EM_PROCESSO_ADOCAO: 1 });
    expect(result.recentActivity[0]).toMatchObject({ id: "h1", kind: "SAUDE_REGISTRADA" });
  });

  it("recomputes metrics from the current source truth after domain changes", async () => {
    const before = await getOperationalDashboard(reference);
    vi.mocked(prisma.animal.findMany).mockResolvedValue([
      { id: "a1", nome: "Luna", status: "ADOTADO", criadoEm: new Date("2026-07-20T10:00:00Z") },
    ] as never);
    vi.mocked(prisma.solicitacaoAdocao.findMany).mockResolvedValue([
      { id: "r1", status: "CONCLUIDA", dataSolicitacao: new Date("2026-07-21T10:00:00Z"), dataAtualizacao: new Date("2026-07-22T12:00:00Z"), animal: { id: "a1", nome: "Luna" } },
    ] as never);
    vi.mocked(prisma.cuidadoPlanejado.findMany).mockResolvedValue([]);
    vi.mocked(prisma.registroSaude.findMany).mockResolvedValue([
      { id: "h2", tipo: "PROCEDIMENTO", criadoEm: new Date("2026-07-22T13:00:00Z"), animal: { id: "a1", nome: "Luna" } },
    ] as never);

    const after = await getOperationalDashboard(reference);
    expect(after.indicators.availableAnimals.count).not.toBe(before.indicators.availableAnimals.count);
    expect(after.indicators.overdueHealthCare.count).toBe(0);
    expect(after.animalStatusCounts.ADOTADO).toBe(1);
    expect(after.recentActivity[0]?.id).toBe("h2");
  });

  it("scopes every aggregate source by the current responsible", async () => {
    await getOperationalDashboard(reference);

    for (const query of [
      vi.mocked(prisma.animal.findMany).mock.calls[0]?.[0],
      vi.mocked(prisma.solicitacaoAdocao.findMany).mock.calls[0]?.[0],
      vi.mocked(prisma.cuidadoPlanejado.findMany).mock.calls[0]?.[0],
      vi.mocked(prisma.registroSaude.findMany).mock.calls[0]?.[0],
    ]) {
      expect(JSON.stringify(query)).toContain(organizationId);
    }
  });
});
