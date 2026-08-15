import { TipoMoradia, TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getProfile, PATCH as patchProfile } from "@/app/api/perfil/route";
import { GET as getScreening, PUT as putScreening } from "@/app/api/triagem/route";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockedGetServerSession = vi.mocked(getServerSession);
const findUser = vi.mocked(prisma.usuario.findUnique);
const updateUser = vi.mocked(prisma.usuario.update);
const updateAdopter = vi.mocked(prisma.adotante.update);

function session(overrides: Partial<Session["user"]> = {}): Session {
  return {
    expires: "2026-08-01T12:00:00.000Z",
    user: {
      id: "user-1",
      email: "org@example.com",
      name: null,
      image: null,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      ativo: true,
      adotanteId: null,
      organizacaoId: "org-1",
      acolhedorId: null,
      ...overrides,
    },
  };
}

const organizationProfile = {
  id: "user-1",
  email: "org@example.com",
  tipoPerfil: TipoPerfil.ORGANIZACAO,
  ativo: true,
  adotante: null,
  organizacao: {
    id: "org-1",
    razaoSocial: "Cia Animal",
    descricao: "Resgate e cuidado animal.",
    fotoUrl: "https://cdn.example.com/org.jpg",
    cnpj: "12345678000199",
    telefone: "24999999999",
    endereco: "Rua A",
    cidade: "Volta Redonda",
    estado: "RJ",
    responsavelNome: "Ana",
    capacidadeMaxima: 20,
  },
  acolhedor: null,
};

const adopterIdentity = {
  id: "user-adopter",
  email: "adopter@example.com",
  tipoPerfil: TipoPerfil.ADOTANTE,
  ativo: true,
  adotante: { id: "adopter-1" },
};

const adopterProfile = {
  ...adopterIdentity,
  adotante: {
    id: "adopter-1",
    nomeCompleto: "Pessoa Adotante",
    cpf: "12345678901",
    telefone: "24999999999",
    instagram: null,
    endereco: "Rua A",
    cidade: "Volta Redonda",
    estado: "RJ",
  },
  organizacao: null,
  acolhedor: null,
};

const screeningInput = {
  motivoAdocao: "Quero oferecer um lar responsavel.",
  tipoAnimalDesejado: "Cachorro",
  podeArcarCustosVet: true,
  adocaoParaPresente: false,
  tipoMoradia: TipoMoradia.CASA,
  moradiaPropria: true,
  numAdultosCasa: 2,
  temCriancas: false,
  todosConordamAdocao: true,
  janelasTeladas: true,
  acessoRua: "Somente com guia",
  murosSeguros: true,
  horasSozinho: "4 horas",
  responsavelViagem: "Familia",
  planoEmGravidez: "Manter o animal",
  alergicosNaCasa: false,
  planoMudanca: "Levar o animal",
  historicoDevolucao: "Nunca",
  historicoPercaDescuido: "Nunca",
  cienteLongevidade: true,
  permiteVisitaProtetor: true,
  ciendeNaoRepassar: true,
  teveAnimaisAntes: true,
  animaisAnterioresDescricao: "Já cuidei de cães durante muitos anos.",
  temOutrosAnimais: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("profile API", () => {
  it("returns only the authenticated user's allowlisted profile fields", async () => {
    mockedGetServerSession.mockResolvedValue(session());
    findUser.mockResolvedValue(organizationProfile as never);

    const response = await getProfile();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      profile: {
        tipoPerfil: "ORGANIZACAO",
        email: "org@example.com",
        id: "org-1",
        razaoSocial: "Cia Animal",
        descricao: "Resgate e cuidado animal.",
        fotoUrl: "https://cdn.example.com/org.jpg",
        cnpj: "12345678000199",
        telefone: "24999999999",
        endereco: "Rua A",
        cidade: "Volta Redonda",
        estado: "RJ",
        responsavelNome: "Ana",
        capacidadeMaxima: 20,
      },
    });

    const serialized = JSON.stringify(body);
    for (const forbidden of [
      "senhaHash",
      "motivoAdocao",
      "triagemConcluida",
      "usuarioId",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("rejects immutable CNPJ before updating the organization", async () => {
    mockedGetServerSession.mockResolvedValue(session());
    findUser.mockResolvedValue(organizationProfile as never);

    const response = await patchProfile(
      new Request("http://localhost/api/perfil", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ razaoSocial: "Novo nome", cnpj: "00000000000000" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("rejects immutable CPF before updating an adopter", async () => {
    mockedGetServerSession.mockResolvedValue(
      session({
        id: "user-adopter",
        email: "adopter@example.com",
        tipoPerfil: TipoPerfil.ADOTANTE,
        adotanteId: "adopter-1",
        organizacaoId: null,
      }),
    );
    findUser.mockResolvedValue(adopterProfile as never);

    const response = await patchProfile(
      new Request("http://localhost/api/perfil", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nomeCompleto: "Novo nome", cpf: "00000000000" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("updates only the authenticated user's allowlisted fields", async () => {
    mockedGetServerSession.mockResolvedValue(session());
    findUser.mockResolvedValue(organizationProfile as never);
    updateUser.mockResolvedValue({
      ...organizationProfile,
      organizacao: {
        ...organizationProfile.organizacao,
        razaoSocial: "Novo nome",
      },
    } as never);

    const response = await patchProfile(
      new Request("http://localhost/api/perfil", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ razaoSocial: "Novo nome" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: {
          organizacao: {
            update: {
              razaoSocial: "Novo nome",
              razaoSocialNormalizada: "novo nome",
            },
          },
        },
      }),
    );
  });

  it("normaliza a razao social na mesma escrita do PATCH", async () => {
    mockedGetServerSession.mockResolvedValue(session());
    findUser.mockResolvedValue(organizationProfile as never);
    updateUser.mockResolvedValue({
      ...organizationProfile,
      organizacao: {
        ...organizationProfile.organizacao,
        razaoSocial: "Proteção à Vida",
      },
    } as never);

    const response = await patchProfile(
      new Request("http://localhost/api/perfil", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ razaoSocial: "Proteção à Vida" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          organizacao: {
            update: expect.objectContaining({
              razaoSocial: "Proteção à Vida",
              razaoSocialNormalizada: "protecao a vida",
            }),
          },
        },
      }),
    );
  });

  it("aceita descricao com ate 500 caracteres e transforma vazio em null", async () => {
    mockedGetServerSession.mockResolvedValue(session());
    findUser.mockResolvedValue(organizationProfile as never);
    updateUser.mockResolvedValue(organizationProfile as never);

    const limite = "a".repeat(500);
    const accepted = await patchProfile(
      new Request("http://localhost/api/perfil", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ descricao: limite }),
      }),
    );

    expect(accepted.status).toBe(200);
    expect(updateUser).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: { organizacao: { update: { descricao: limite } } },
      }),
    );

    const cleared = await patchProfile(
      new Request("http://localhost/api/perfil", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ descricao: "   " }),
      }),
    );

    expect(cleared.status).toBe(200);
    expect(updateUser).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: { organizacao: { update: { descricao: null } } },
      }),
    );

    const explicitlyCleared = await patchProfile(
      new Request("http://localhost/api/perfil", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ descricao: null }),
      }),
    );
    expect(explicitlyCleared.status).toBe(200);
    expect(updateUser).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: { organizacao: { update: { descricao: null } } },
      }),
    );
  });

  it("rejeita descricao acima de 500 e a coluna derivada enviada pelo cliente", async () => {
    mockedGetServerSession.mockResolvedValue(session());
    findUser.mockResolvedValue(organizationProfile as never);

    for (const body of [
      { descricao: "a".repeat(501) },
      { razaoSocialNormalizada: "valor-forjado" },
      { fotoUrl: "https://example.com/forjada.jpg" },
      { profileId: "org-alheia" },
    ]) {
      const response = await patchProfile(
        new Request("http://localhost/api/perfil", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }),
      );

      expect(response.status).toBe(400);
    }

    expect(updateUser).not.toHaveBeenCalled();
  });

  it("returns 401 without an authenticated session", async () => {
    mockedGetServerSession.mockResolvedValue(null);

    const response = await getProfile();

    expect(response.status).toBe(401);
    expect(findUser).not.toHaveBeenCalled();
  });

  it("blocks profile reads when the current account is inactive", async () => {
    mockedGetServerSession.mockResolvedValue(session());
    findUser.mockResolvedValue({ ...organizationProfile, ativo: false } as never);

    const response = await getProfile();

    expect(response.status).toBe(403);
  });
});

describe("screening API", () => {
  it("saves screening only for the adopter id derived from the session", async () => {
    mockedGetServerSession.mockResolvedValue(
      session({
        id: "user-adopter",
        email: "adopter@example.com",
        tipoPerfil: TipoPerfil.ADOTANTE,
        adotanteId: "adopter-1",
        organizacaoId: null,
      }),
    );
    findUser.mockResolvedValue(adopterIdentity as never);
    updateAdopter.mockResolvedValue({
      id: "adopter-1",
      ...screeningInput,
      triagemConcluida: true,
    } as never);

    const response = await putScreening(
      new Request("http://localhost/api/triagem", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...screeningInput, adotanteId: "other-adopter" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(updateAdopter).not.toHaveBeenCalled();

    const validResponse = await putScreening(
      new Request("http://localhost/api/triagem", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(screeningInput),
      }),
    );

    expect(validResponse.status).toBe(200);
    expect(updateAdopter).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "adopter-1" } }),
    );
  });

  it("denies screening access to organization users", async () => {
    mockedGetServerSession.mockResolvedValue(session());
    findUser.mockResolvedValue(organizationProfile as never);

    const response = await getScreening();

    expect(response.status).toBe(403);
    expect(prisma.adotante.findUnique).not.toHaveBeenCalled();
  });
});
