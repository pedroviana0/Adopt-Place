import { StatusAnimal, StatusSolicitacao, TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAdoptionRequest, decideAdoptionRequest } from "@/lib/actions/solicitacoes";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const animalId = "cm00000000000000000000001";
const adotanteId = "cm00000000000000000000002";
const solicitacaoId = "cm00000000000000000000007";
const organizacaoId = "cm00000000000000000000008";
const otherOrganizacaoId = "cm00000000000000000000009";

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
  mockResolvedValue(value: { status: StatusAnimal } | null): void;
};
const findSolicitacao = prisma.solicitacaoAdocao.findFirst as unknown as {
  mockResolvedValue(value: { id: string } | null): void;
};
const createSolicitacao = prisma.solicitacaoAdocao.create as unknown as {
  mockResolvedValue(value: { id: string }): void;
};
const findSolicitacaoById = prisma.solicitacaoAdocao.findUnique as unknown as {
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
  };
};

function decisionRequest(ownerId = organizacaoId): DecisionRequest {
  return {
    id: solicitacaoId,
    animalId,
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
      updateMany: vi.fn().mockResolvedValue({ count: 2 }),
    },
    animal: {
      update: vi.fn().mockResolvedValue({ id: animalId }),
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
      findAnimal.mockResolvedValue({ status: StatusAnimal.DISPONIVEL });
      findSolicitacao.mockResolvedValue(null);
      createSolicitacao.mockResolvedValue({ id: "cm00000000000000000000006" });

      // When
      const result = await createAdoptionRequest(animalId);

      // Then
      expect(mockedPrisma.solicitacaoAdocao.create).toHaveBeenCalledWith({
        data: {
          adotanteId,
          animalId,
          status: StatusSolicitacao.EM_ANALISE,
        },
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

      expect(result).toEqual({ error: "NÃ£o autenticado" });
      expect(prisma.solicitacaoAdocao.findUnique).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("returns an error for adopter users", async () => {
      mockedGetServerSession.mockResolvedValue(session());

      const result = await decideAdoptionRequest(solicitacaoId, {
        decision: "APROVADA",
      });

      expect(result.error).toBe("Apenas organizaÃ§Ãµes ou acolhedores podem decidir solicitaÃ§Ãµes");
      expect(prisma.solicitacaoAdocao.findUnique).not.toHaveBeenCalled();
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
      findSolicitacaoById.mockResolvedValue(decisionRequest(otherOrganizacaoId));

      const result = await decideAdoptionRequest(solicitacaoId, {
        decision: "APROVADA",
      });

      expect(result.error).toBe("Acesso negado");
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
      expect(prisma.solicitacaoAdocao.findUnique).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("decision APROVADA", () => {
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
      expect(tx.solicitacaoAdocao.update).toHaveBeenCalledWith({
        where: { id: solicitacaoId },
        data: {
          status: StatusSolicitacao.APROVADA,
          observacoes: "Aprovado apos triagem.",
        },
      });
      expect(tx.animal.update).toHaveBeenCalledWith({
        where: { id: animalId },
        data: { status: StatusAnimal.EM_PROCESSO_ADOCAO },
      });
      expect(tx.solicitacaoAdocao.updateMany).toHaveBeenCalledWith({
        where: {
          animalId,
          status: StatusSolicitacao.EM_ANALISE,
          id: { not: solicitacaoId },
        },
        data: { status: StatusSolicitacao.RECUSADA },
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
      expect(tx.solicitacaoAdocao.update).toHaveBeenCalledWith({
        where: { id: solicitacaoId },
        data: {
          status: StatusSolicitacao.RECUSADA,
          observacoes: "Perfil nao aderente.",
        },
      });
      expect(tx.animal.update).not.toHaveBeenCalled();
      expect(tx.solicitacaoAdocao.updateMany).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });
});
