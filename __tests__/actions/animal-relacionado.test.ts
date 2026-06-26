import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { linkAnimals, unlinkAnimals } from "@/lib/actions/animal-relacionado";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const animalAId = "cm00000000000000000000001";
const animalBId = "cm00000000000000000000002";
const animalOtherOwnerId = "cm00000000000000000000003";
const organizacaoId = "cm00000000000000000000004";
const otherOrganizacaoId = "cm00000000000000000000005";

type OwnedAnimal = {
  id: string;
  organizacaoId: string | null;
  acolhedorId: string | null;
};

type TransactionClient = {
  animalRelacionado: {
    findFirst: ReturnType<typeof vi.fn>;
    createMany: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
};

function session(overrides: Partial<Session["user"]> = {}): Session {
  return {
    expires: new Date(Date.now() + 60_000).toISOString(),
    user: {
      id: "cm00000000000000000000006",
      email: "org@example.com",
      name: "Organizacao",
      image: null,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      ativo: true,
      adotanteId: null,
      organizacaoId,
      acolhedorId: null,
      ...overrides,
    },
  };
}

function ownedAnimal(id: string, ownerId = organizacaoId): OwnedAnimal {
  return {
    id,
    organizacaoId: ownerId,
    acolhedorId: null,
  };
}

const mockedGetServerSession = vi.mocked(getServerSession);
const findAnimal = prisma.animal.findUnique as unknown as {
  mockResolvedValue(value: OwnedAnimal | null): void;
  mockResolvedValueOnce(value: OwnedAnimal | null): void;
};
const transactionMock = prisma.$transaction as unknown as {
  mockImplementation(
    implementation: (callback: (tx: TransactionClient) => Promise<{ success: true }>) => Promise<{ success: true }>,
  ): void;
};
const globalCreateMany = prisma.animalRelacionado.createMany as unknown as {
  mockResolvedValue(value: { count: number }): void;
};

function transactionClient(existingPair: { animalId: string; animalRelacionadoId: string } | null = null) {
  return {
    animalRelacionado: {
      findFirst: vi.fn().mockResolvedValue(existingPair),
      createMany: vi.fn().mockResolvedValue({ count: 2 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
    },
  };
}

function mockTransaction(tx: TransactionClient): void {
  transactionMock.mockImplementation(async (callback) => callback(tx));
}

beforeEach(() => {
  vi.clearAllMocks();
  globalCreateMany.mockResolvedValue({ count: 2 });
});

describe("animal relationship actions", () => {
  describe("guards", () => {
    it("returns an unauthenticated error for linkAnimals without session", async () => {
      mockedGetServerSession.mockResolvedValue(null);

      const result = await linkAnimals({ animalId: animalAId, animalRelacionadoId: animalBId });

      expect(result.error).toBe("Não autenticado");
      expect(prisma.animal.findUnique).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("returns an unauthenticated error for unlinkAnimals without session", async () => {
      mockedGetServerSession.mockResolvedValue(null);

      const result = await unlinkAnimals(animalAId, animalBId);

      expect(result.error).toBe("Não autenticado");
      expect(prisma.animal.findUnique).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("returns an error for wrong role", async () => {
      mockedGetServerSession.mockResolvedValue(
        session({
          tipoPerfil: TipoPerfil.ADOTANTE,
          adotanteId: "cm00000000000000000000007",
          organizacaoId: null,
        }),
      );

      const result = await linkAnimals({ animalId: animalAId, animalRelacionadoId: animalBId });

      expect(result.error).toBe("Apenas organizações ou acolhedores podem gerenciar animais");
      expect(prisma.animal.findUnique).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("returns an error for wrong role when unlinking", async () => {
      mockedGetServerSession.mockResolvedValue(
        session({
          tipoPerfil: TipoPerfil.ADOTANTE,
          adotanteId: "cm00000000000000000000008",
          organizacaoId: null,
        }),
      );

      const result = await unlinkAnimals(animalAId, animalBId);

      expect(result.error).toBe("Apenas organizações ou acolhedores podem gerenciar animais");
      expect(prisma.animal.findUnique).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("returns access denied when the caller does not own both animals", async () => {
      mockedGetServerSession.mockResolvedValue(session());
      findAnimal.mockResolvedValueOnce(ownedAnimal(animalAId));
      findAnimal.mockResolvedValueOnce(ownedAnimal(animalOtherOwnerId, otherOrganizacaoId));

      const result = await linkAnimals({
        animalId: animalAId,
        animalRelacionadoId: animalOtherOwnerId,
      });

      expect(result.error).toBe("Acesso negado");
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("returns access denied when unlinking animals not both owned by the caller", async () => {
      mockedGetServerSession.mockResolvedValue(session());
      findAnimal.mockResolvedValueOnce(ownedAnimal(animalAId));
      findAnimal.mockResolvedValueOnce(ownedAnimal(animalOtherOwnerId, otherOrganizacaoId));

      const result = await unlinkAnimals(animalAId, animalOtherOwnerId);

      expect(result.error).toBe("Acesso negado");
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("linkAnimals", () => {
    it("rejects self-link", async () => {
      mockedGetServerSession.mockResolvedValue(session());

      const result = await linkAnimals({ animalId: animalAId, animalRelacionadoId: animalAId });

      expect(result.error).toBe("Um animal não pode ser relacionado a si mesmo");
      expect(prisma.animal.findUnique).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("inserts both relationship directions in one transaction", async () => {
      const tx = transactionClient();
      mockedGetServerSession.mockResolvedValue(session());
      findAnimal.mockResolvedValueOnce(ownedAnimal(animalAId));
      findAnimal.mockResolvedValueOnce(ownedAnimal(animalBId));
      mockTransaction(tx);

      const result = await linkAnimals({ animalId: animalAId, animalRelacionadoId: animalBId });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.animalRelacionado.createMany).toHaveBeenCalledWith({
        data: [
          { animalId: animalAId, animalRelacionadoId: animalBId },
          { animalId: animalBId, animalRelacionadoId: animalAId },
        ],
        skipDuplicates: true,
      });
      expect(tx.animalRelacionado.createMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ success: true });
    });

    it("silently ignores an existing relationship without creating duplicates", async () => {
      const tx = transactionClient({ animalId: animalAId, animalRelacionadoId: animalBId });
      mockedGetServerSession.mockResolvedValue(session());
      findAnimal.mockResolvedValueOnce(ownedAnimal(animalAId));
      findAnimal.mockResolvedValueOnce(ownedAnimal(animalBId));
      mockTransaction(tx);

      const result = await linkAnimals({ animalId: animalAId, animalRelacionadoId: animalBId });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.animalRelacionado.createMany).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe("unlinkAnimals", () => {
    it("deletes both relationship directions in one transaction", async () => {
      const tx = transactionClient();
      mockedGetServerSession.mockResolvedValue(session());
      findAnimal.mockResolvedValueOnce(ownedAnimal(animalAId));
      findAnimal.mockResolvedValueOnce(ownedAnimal(animalBId));
      mockTransaction(tx);

      const result = await unlinkAnimals(animalAId, animalBId);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.animalRelacionado.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { animalId: animalAId, animalRelacionadoId: animalBId },
            { animalId: animalBId, animalRelacionadoId: animalAId },
          ],
        },
      });
      expect(result).toEqual({ success: true });
    });
  });
});
