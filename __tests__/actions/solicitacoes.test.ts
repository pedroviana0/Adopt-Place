import { StatusAnimal, StatusSolicitacao, TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { completeAdoption, createAdoptionRequest, decideAdoptionRequest } from "@/lib/actions/solicitacoes";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const animalId = "cm00000000000000000000001";
const adotanteId = "cm00000000000000000000002";
const solicitacaoId = "cm00000000000000000000007";
const organizacaoId = "cm00000000000000000000008";
const adopterUserId = "cm00000000000000000000010";
const conversationId = "cm00000000000000000000011";

function session(overrides: Partial<Session["user"]> = {}): Session {
  return {
    expires: new Date(Date.now() + 60_000).toISOString(),
    user: {
      id: "cm00000000000000000000003",
      email: "adotante@example.com",
      name: "Adotante",
      image: null,
      tipoPerfil: TipoPerfil.ADOTANTE,
      ativo: true,
      adotanteId,
      organizacaoId: null,
      acolhedorId: null,
      ...overrides,
    },
  };
}

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedPrisma = vi.mocked(prisma);
const findAdotante = prisma.adotante.findUnique as unknown as {
  mockResolvedValue(value: { triagemConcluida: boolean } | null): void;
};
const findAnimal = prisma.animal.findUnique as unknown as {
  mockResolvedValue(
    value:
      | {
          status: StatusAnimal;
          nome?: string;
          organizacao?: { usuarioId: string } | null;
          acolhedor?: { usuarioId: string } | null;
        }
      | null,
  ): void;
};
const findSolicitacao = prisma.solicitacaoAdocao.findFirst as unknown as {
  mockResolvedValue(value: { id: string } | null): void;
};
const createSolicitacao = prisma.solicitacaoAdocao.create as unknown as {
  mockResolvedValue(value: { id: string; adotante?: { nomeCompleto: string } }): void;
};
const findSolicitacaoById = prisma.solicitacaoAdocao.findFirst as unknown as {
  mockResolvedValue(value: DecisionRequest | null): void;
};
const transactionMock = prisma.$transaction as unknown as {
  mockImplementation(
    implementation: (
      callback: (tx: DecisionTransactionClient) => Promise<void>,
    ) => Promise<void>,
  ): void;
};

type DecisionRequest = {
  id: string;
  animalId: string;
  status?: StatusSolicitacao;
  adotante: { usuarioId: string };
  animal: {
    id: string;
    organizacaoId: string | null;
    acolhedorId: string | null;
  };
};

type DecisionTransactionClient = {
  solicitacaoAdocao: {
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  animal: {
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  conversaAdocao: {
    upsert: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  conversaParticipante: {
    createMany: ReturnType<typeof vi.fn>;
  };
};

function decisionRequest(ownerId = organizacaoId): DecisionRequest {
  return {
    id: solicitacaoId,
    animalId,
    status: StatusSolicitacao.EM_ANALISE,
    adotante: { usuarioId: adopterUserId },
    animal: {
      id: animalId,
      organizacaoId: ownerId,
      acolhedorId: null,
    },
  };
}

function decisionTransactionClient(): DecisionTransactionClient {
  return {
    solicitacaoAdocao: {
      update: vi.fn().mockResolvedValue({ id: solicitacaoId }),
      updateMany: vi.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValue({ count: 2 }),
    },
    animal: {
      update: vi.fn().mockResolvedValue({ id: animalId }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    conversaAdocao: {
      upsert: vi.fn().mockResolvedValue({ id: conversationId }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    conversaParticipante: {
      createMany: vi.fn().mockResolvedValue({ count: 2 }),
    },
  };
}

function mockDecisionTransaction(tx: DecisionTransactionClient): void {
  transactionMock.mockImplementation(async (callback) => {
    await callback(tx);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
    ativo: true,
    tipoPerfil: TipoPerfil.ORGANIZACAO,
    organizacao: { id: organizacaoId },
    acolhedor: null,
  } as never);
});

describe("createAdoptionRequest", () => {
  describe("session guard", () => {
    it("returns unauthenticated error when there is no session", async () => {
      // Given
      mockedGetServerSession.mockResolvedValue(null);

      // When
      const result = await createAdoptionRequest(animalId);

      // Then
      expect(result).toEqual({ error: "Não autenticado" });
      expect(mockedPrisma.solicitacaoAdocao.create).not.toHaveBeenCalled();
    });
  });

  describe("adopter-only guard", () => {
    it("returns an error for organization users", async () => {
      // Given
      mockedGetServerSession.mockResolvedValue(
        session({
          tipoPerfil: TipoPerfil.ORGANIZACAO,
          adotanteId: null,
          organizacaoId: "cm00000000000000000000004",
        }),
      );

      // When
      const result = await createAdoptionRequest(animalId);

      // Then
      expect(result.error).toBe("Apenas adotantes podem solicitar adoção");
      expect(mockedPrisma.solicitacaoAdocao.create).not.toHaveBeenCalled();
    });
  });

  describe("screening guard FR-019", () => {
    it("blocks unscreened adopters and points them to triagem", async () => {
      // Given
      mockedGetServerSession.mockResolvedValue(session());
      findAdotante.mockResolvedValue({ triagemConcluida: false });

      // When
      const result = await createAdoptionRequest(animalId);

      // Then
      expect(result.error).toContain("triagem");
      expect(result.error).toContain("/dashboard/triagem");
      expect(mockedPrisma.solicitacaoAdocao.create).not.toHaveBeenCalled();
    });
  });

  describe("availability guard FR-023", () => {
    it("returns an error and does not create a request when animal is unavailable", async () => {
      // Given
      mockedGetServerSession.mockResolvedValue(session());
      findAdotante.mockResolvedValue({ triagemConcluida: true });
      findAnimal.mockResolvedValue({ status: StatusAnimal.EM_CUIDADOS });

      // When
      const result = await createAdoptionRequest(animalId);

      // Then
      expect(result.error).toBe("Animal indisponível para adoção");
      expect(mockedPrisma.solicitacaoAdocao.create).not.toHaveBeenCalled();
    });
  });

  describe("duplicate guard FR-022", () => {
    it("returns an active request error for the same adopter and animal", async () => {
      // Given
      mockedGetServerSession.mockResolvedValue(session());
      findAdotante.mockResolvedValue({ triagemConcluida: true });
      findAnimal.mockResolvedValue({ status: StatusAnimal.DISPONIVEL });
      findSolicitacao.mockResolvedValue({ id: "cm00000000000000000000005" });

      // When
      const result = await createAdoptionRequest(animalId);

      // Then
      expect(result).toEqual({
        error: "Você já tem uma solicitação ativa para este animal",
      });
      expect(mockedPrisma.solicitacaoAdocao.create).not.toHaveBeenCalled();
    });
  });

  describe("happy path FR-021", () => {
    it("creates an EM_ANALISE request when all guards pass", async () => {
      // Given
      mockedGetServerSession.mockResolvedValue(session());
      findAdotante.mockResolvedValue({ triagemConcluida: true });
      findAnimal.mockResolvedValue({
        status: StatusAnimal.DISPONIVEL,
        nome: "Rex",
        organizacao: { usuarioId: "cm00000000000000000000009" },
        acolhedor: null,
      });
      findSolicitacao.mockResolvedValue(null);
      createSolicitacao.mockResolvedValue({
        id: "cm00000000000000000000006",
        adotante: { nomeCompleto: "Adotante Teste" },
      });

      // When
      const result = await createAdoptionRequest(animalId);

      // Then
      expect(mockedPrisma.solicitacaoAdocao.create).toHaveBeenCalledWith({
        data: {
          adotanteId,
          animalId,
          status: StatusSolicitacao.EM_ANALISE,
        },
        select: { id: true, adotante: { select: { nomeCompleto: true } } },
      });
      // Notifica o responsável pelo animal (efeito colateral informativo).
      expect(mockedPrisma.notificacao.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            usuarioId: "cm00000000000000000000009",
            tipo: "SOLICITACAO_RECEBIDA",
          }),
        ],
      });
      expect(result).toEqual({ success: true });
    });
  });
});

describe("decideAdoptionRequest", () => {
  describe("guards", () => {
    it("returns unauthenticated error when there is no session", async () => {
      mockedGetServerSession.mockResolvedValue(null);

      const result = await decideAdoptionRequest(solicitacaoId, {
        decision: "APROVADA",
      });

      expect(result.code).toBe("UNAUTHENTICATED");
      expect(prisma.solicitacaoAdocao.findFirst).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("returns an error for adopter users", async () => {
      mockedGetServerSession.mockResolvedValue(session());
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
        ativo: true,
        tipoPerfil: TipoPerfil.ADOTANTE,
        organizacao: null,
        acolhedor: null,
      } as never);

      const result = await decideAdoptionRequest(solicitacaoId, {
        decision: "APROVADA",
      });

      expect(result.code).toBe("FORBIDDEN");
      expect(prisma.solicitacaoAdocao.findFirst).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("returns access denied when the requester does not own the animal", async () => {
      mockedGetServerSession.mockResolvedValue(
        session({
          tipoPerfil: TipoPerfil.ORGANIZACAO,
          adotanteId: null,
          organizacaoId,
        }),
      );
      findSolicitacaoById.mockResolvedValue(null);

      const result = await decideAdoptionRequest(solicitacaoId, {
        decision: "APROVADA",
      });

      expect(result.code).toBe("NOT_FOUND");
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("validation", () => {
    it("validates observations with requestDecisionSchema", async () => {
      mockedGetServerSession.mockResolvedValue(
        session({
          tipoPerfil: TipoPerfil.ORGANIZACAO,
          adotanteId: null,
          organizacaoId,
        }),
      );

      const result = await decideAdoptionRequest(solicitacaoId, {
        decision: "RECUSADA",
        observacoes: "a".repeat(1001),
      });

      expect(result.error).toContain("1000 caracteres");
      expect(prisma.solicitacaoAdocao.findFirst).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("decision APROVADA", () => {
    it("rejects a request that is no longer in analysis", async () => {
      mockedGetServerSession.mockResolvedValue(
        session({
          tipoPerfil: TipoPerfil.ORGANIZACAO,
          adotanteId: null,
          organizacaoId,
        }),
      );
      findSolicitacaoById.mockResolvedValue({
        ...decisionRequest(),
        status: StatusSolicitacao.APROVADA,
      });

      const result = await decideAdoptionRequest(solicitacaoId, {
        decision: "RECUSADA",
      });

      expect(result.code).toBe("INVALID_TRANSITION");
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("updates request, animal, and competing requests in one transaction", async () => {
      const tx = decisionTransactionClient();
      mockedGetServerSession.mockResolvedValue(
        session({
          tipoPerfil: TipoPerfil.ORGANIZACAO,
          adotanteId: null,
          organizacaoId,
        }),
      );
      findSolicitacaoById.mockResolvedValue(decisionRequest());
      mockDecisionTransaction(tx);

      const result = await decideAdoptionRequest(solicitacaoId, {
        decision: "APROVADA",
        observacoes: "Aprovado apos triagem.",
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.solicitacaoAdocao.updateMany).toHaveBeenNthCalledWith(1, {
        where: {
          id: solicitacaoId,
          status: StatusSolicitacao.EM_ANALISE,
        },
        data: {
          status: StatusSolicitacao.APROVADA,
          observacoes: "Aprovado apos triagem.",
        },
      });
      expect(tx.animal.updateMany).toHaveBeenCalledWith({
        where: { id: animalId, status: StatusAnimal.DISPONIVEL },
        data: { status: StatusAnimal.EM_PROCESSO_ADOCAO },
      });
      expect(tx.solicitacaoAdocao.updateMany).toHaveBeenNthCalledWith(2, {
        where: {
          animalId,
          status: StatusSolicitacao.EM_ANALISE,
          id: { not: solicitacaoId },
        },
        data: { status: StatusSolicitacao.RECUSADA },
      });
      expect(tx.conversaAdocao.upsert).toHaveBeenCalledWith({
        where: { solicitacaoId },
        create: { solicitacaoId, status: "ATIVA" },
        update: {},
        select: { id: true },
      });
      expect(tx.conversaParticipante.createMany).toHaveBeenCalledWith({
        data: [
          { conversaId: conversationId, usuarioId: adopterUserId },
          { conversaId: conversationId, usuarioId: "cm00000000000000000000003" },
        ],
        skipDuplicates: true,
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe("decision RECUSADA", () => {
    it("refuses only the selected request and leaves the animal available", async () => {
      const tx = decisionTransactionClient();
      mockedGetServerSession.mockResolvedValue(
        session({
          tipoPerfil: TipoPerfil.ORGANIZACAO,
          adotanteId: null,
          organizacaoId,
        }),
      );
      findSolicitacaoById.mockResolvedValue(decisionRequest());
      mockDecisionTransaction(tx);

      const result = await decideAdoptionRequest(solicitacaoId, {
        decision: "RECUSADA",
        observacoes: "Perfil nao aderente.",
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.solicitacaoAdocao.updateMany).toHaveBeenCalledWith({
        where: {
          id: solicitacaoId,
          status: StatusSolicitacao.EM_ANALISE,
        },
        data: {
          status: StatusSolicitacao.RECUSADA,
          observacoes: "Perfil nao aderente.",
        },
      });
      expect(tx.animal.updateMany).not.toHaveBeenCalled();
      expect(tx.solicitacaoAdocao.updateMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ success: true });
    });
  });
});

describe("chat lifecycle in adoption transaction", () => {
  it("archives the conversation when the approved adoption is completed", async () => {
    const tx = decisionTransactionClient();
    mockedGetServerSession.mockResolvedValue(session({ tipoPerfil: TipoPerfil.ORGANIZACAO, adotanteId: null, organizacaoId }));
    findSolicitacaoById.mockResolvedValue({
      ...decisionRequest(),
      status: StatusSolicitacao.APROVADA,
    });
    mockDecisionTransaction(tx);

    await expect(completeAdoption(solicitacaoId)).resolves.toEqual({ success: true });
    expect(tx.conversaAdocao.updateMany).toHaveBeenCalledWith({
      where: { solicitacaoId },
      data: { status: "ARQUIVADA", arquivadaEm: expect.any(Date) },
    });
  });

  it("creates conversation and duplicate-safe participants on approval", async () => {
    const tx = decisionTransactionClient();
    mockedGetServerSession.mockResolvedValue(session({ tipoPerfil: TipoPerfil.ORGANIZACAO, adotanteId: null, organizacaoId }));
    findSolicitacaoById.mockResolvedValue(decisionRequest());
    mockDecisionTransaction(tx);

    await decideAdoptionRequest(solicitacaoId, { decision: "APROVADA" });

    expect(tx.conversaAdocao.upsert).toHaveBeenCalledTimes(1);
    expect(tx.conversaParticipante.createMany).toHaveBeenCalledTimes(1);
    expect(tx.conversaParticipante.createMany).toHaveBeenLastCalledWith(expect.objectContaining({ skipDuplicates: true }));
  });
});
