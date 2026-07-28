import { vi } from "vitest";

// Mock Prisma Client para testes de Server Actions
vi.mock("@/lib/prisma", () => ({
  prisma: {
    adotante: { findUnique: vi.fn(), update: vi.fn() },
    solicitacaoAdocao: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
  animal: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    animalRelacionado: { findFirst: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
    favorito: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    registroSaude: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    cuidadoPlanejado: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    documentoSaude: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    conversaAdocao: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    conversaParticipante: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    mensagemAdocao: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    usuario: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    especie: { findMany: vi.fn() },
    raca: { findMany: vi.fn() },
    organizacao: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    acolhedorIndependente: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    // Support both the array form `$transaction([p1, p2])` (public queries) and
    // the callback form `$transaction(async (tx) => ...)` used elsewhere.
    $transaction: vi.fn((arg) => (Array.isArray(arg) ? Promise.all(arg) : arg())),
  },
}));

vi.mock("@/lib/auth", () => ({
  INACTIVE_ACCOUNT_MESSAGE: "Conta desativada. Entre em contato com o administrador",
  getServerSession: vi.fn(),
}));

// Mock getServerSession - cada teste sobrescreve conforme necessario
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));
