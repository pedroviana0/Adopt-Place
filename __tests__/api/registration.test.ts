import { TipoPerfil } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/cadastro/[tipo]/route";
import { prisma } from "@/lib/prisma";

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed-password"),
}));

const findUser = vi.mocked(prisma.usuario.findUnique);
const findOrganization = vi.mocked(prisma.organizacao.findUnique);
const findAdopter = vi.mocked(prisma.adotante.findUnique);
const findFoster = vi.mocked(prisma.acolhedorIndependente.findUnique);
const createUser = vi.mocked(prisma.usuario.create);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/cadastro/[tipo]", () => {
  it("creates an organization through a safe nested write and returns no credential", async () => {
    findUser.mockResolvedValue(null);
    findOrganization.mockResolvedValue(null);
    createUser.mockResolvedValue({
      id: "user-org",
      email: "org@example.com",
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      ativo: true,
      organizacao: { id: "org-1" },
    } as never);

    const response = await POST(
      new Request("http://localhost/api/cadastro/organizacao", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "org@example.com",
          password: "senha123",
          razaoSocial: "Cia Animal",
          cnpj: "12345678000199",
          telefone: "24999999999",
          endereco: "Rua A",
          cidade: "Volta Redonda",
          estado: "rj",
          responsavelNome: "Ana",
          capacidadeMaxima: 20,
        }),
      }),
      { params: Promise.resolve({ tipo: "organizacao" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipoPerfil: TipoPerfil.ORGANIZACAO,
          senhaHash: "hashed-password",
          organizacao: {
            create: expect.objectContaining({
              cnpj: "12345678000199",
              estado: "RJ",
            }),
          },
        }),
      }),
    );
    expect(body).toEqual({
      user: {
        id: "user-org",
        email: "org@example.com",
        tipoPerfil: "ORGANIZACAO",
        ativo: true,
        profileId: "org-1",
      },
    });
    expect(JSON.stringify(body)).not.toContain("senha");
    expect(JSON.stringify(body)).not.toContain("password");
  });

  it("returns a conflict without writing when the email already exists", async () => {
    findUser.mockResolvedValue({ id: "existing-user" } as never);

    const response = await POST(
      new Request("http://localhost/api/cadastro/adotante", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "existing@example.com",
          password: "senha123",
          nomeCompleto: "Pessoa Adotante",
          cpf: "12345678901",
          telefone: "24999999999",
          endereco: "Rua A",
          cidade: "Volta Redonda",
          estado: "RJ",
        }),
      }),
      { params: Promise.resolve({ tipo: "adotante" }) },
    );

    expect(response.status).toBe(409);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("rejects account-control fields before writing", async () => {
    const response = await POST(
      new Request("http://localhost/api/cadastro/adotante", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "adopter@example.com",
          password: "senha123",
          nomeCompleto: "Pessoa Adotante",
          cpf: "12345678901",
          telefone: "24999999999",
          endereco: "Rua A",
          cidade: "Volta Redonda",
          estado: "RJ",
          ativo: true,
          tipoPerfil: TipoPerfil.ADMIN,
        }),
      }),
      { params: Promise.resolve({ tipo: "adotante" }) },
    );

    expect(response.status).toBe(400);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("creates a foster account without exposing credentials", async () => {
    findUser.mockResolvedValue(null);
    findAdopter.mockResolvedValue(null);
    findFoster.mockResolvedValue(null);
    createUser.mockResolvedValue({
      id: "user-foster",
      email: "foster@example.com",
      tipoPerfil: TipoPerfil.ACOLHEDOR,
      ativo: true,
      acolhedor: { id: "foster-1" },
    } as never);

    const response = await POST(
      new Request("http://localhost/api/cadastro/acolhedor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "foster@example.com",
          password: "senha123",
          nomeCompleto: "Pessoa Acolhedora",
          cpf: "12345678901",
          telefone: "24999999999",
          endereco: "Rua A",
          cidade: "Volta Redonda",
          estado: "rj",
        }),
      }),
      { params: Promise.resolve({ tipo: "acolhedor" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipoPerfil: TipoPerfil.ACOLHEDOR,
          acolhedor: {
            create: expect.objectContaining({
              cpf: "12345678901",
              estado: "RJ",
            }),
          },
        }),
      }),
    );
    expect(JSON.stringify(body)).not.toContain("senha");
    expect(JSON.stringify(body)).not.toContain("password");
  });
});
