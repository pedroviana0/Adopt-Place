import { vi } from "vitest";

// Mock Prisma Client para testes de Server Actions
vi.mock("@/lib/prisma", () => ({
  prisma: {
    adotante: { findUnique: vi.fn() },
    solicitacaoAdocao: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    animal: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    animalRelacionado: { findFirst: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
    favorito: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    usuario: { update: vi.fn(), findMany: vi.fn() },
    $transaction: vi.fn((fn) => fn()),
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
