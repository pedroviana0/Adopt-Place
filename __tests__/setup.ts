import { vi } from 'vitest'

// Mock Prisma Client para testes de Server Actions
vi.mock('@/lib/prisma', () => ({
  prisma: {
    solicitacaoAdocao: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    animal: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    animalRelacionado: { findFirst: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
    usuario: { update: vi.fn(), findMany: vi.fn() },
    $transaction: vi.fn((fn) => fn()),
  },
}))

// Mock getServerSession — cada teste sobrescreve conforme necessário
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))