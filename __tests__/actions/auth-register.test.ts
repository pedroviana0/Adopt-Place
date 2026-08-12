import { PrecisaoCoordenada, TipoPerfil } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("senha-hash"),
}));

vi.mock("@/lib/localizacao", () => ({
  camposDeLocalizacao: vi.fn(() => ({
    cep: "27200-000",
    cidade: "Volta Redonda",
    estado: "RJ",
    municipioId: "3306305",
    latitude: -22.52,
    longitude: -44.1,
    precisaoCoordenada: PrecisaoCoordenada.MUNICIPIO,
  })),
  resolverLocalizacaoOuFalhar: vi.fn().mockResolvedValue({
    cep: "27200-000",
    cidade: "Volta Redonda",
    estado: "RJ",
    municipioId: "3306305",
    latitude: -22.52,
    longitude: -44.1,
    precisaoCoordenada: PrecisaoCoordenada.MUNICIPIO,
    logradouro: null,
    bairro: null,
  }),
}));

import { createOrganizationAccount } from "@/lib/actions/auth-register";
import { prisma } from "@/lib/prisma";

const findUser = vi.mocked(prisma.usuario.findUnique);
const findOrganization = vi.mocked(prisma.organizacao.findUnique);
const createUser = vi.mocked(prisma.usuario.create);

beforeEach(() => {
  vi.clearAllMocks();
  findUser.mockResolvedValue(null);
  findOrganization.mockResolvedValue(null);
  createUser.mockResolvedValue({
    id: "user-1",
    email: "org@example.com",
    tipoPerfil: TipoPerfil.ORGANIZACAO,
    ativo: true,
    organizacao: { id: "org-1" },
  } as never);
});

describe("createOrganizationAccount", () => {
  it("grava a razao social normalizada pelo helper compartilhado", async () => {
    await createOrganizationAccount({
      email: "org@example.com",
      password: "SenhaSegura123!",
      razaoSocial: "  PROTEÇÃO   À VIDA  ",
      cnpj: "12345678000199",
      telefone: "24999999999",
      endereco: "Rua A",
      cep: "27200-000",
      responsavelNome: "Ana Responsavel",
      capacidadeMaxima: 20,
    });

    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizacao: {
            create: expect.objectContaining({
              razaoSocial: "  PROTEÇÃO   À VIDA  ",
              razaoSocialNormalizada: "protecao a vida",
            }),
          },
        }),
      }),
    );
  });
});
