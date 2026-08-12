import {
  StatusAnimal,
  StatusSolicitacao,
  TipoPerfil,
} from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getDashboard } from "@/app/api/dashboard/adotante/route";
import { GET as getFavorites } from "@/app/api/favoritos/route";
import {
  DELETE as deleteFavorite,
  PUT as putFavorite,
} from "@/app/api/favoritos/[animalId]/route";
import {
  GET as getRequests,
  POST as postRequest,
} from "@/app/api/solicitacoes/route";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const userId = "cm00000000000000000000001";
const adopterId = "cm00000000000000000000002";
const animalId = "cm00000000000000000000003";
const requestId = "cm00000000000000000000004";

const mockedGetServerSession = vi.mocked(getServerSession);
const findUser = vi.mocked(prisma.usuario.findUnique);
const findAdopter = vi.mocked(prisma.adotante.findUnique);
const findAnimal = vi.mocked(prisma.animal.findUnique);
const findFavorite = vi.mocked(prisma.favorito.findMany);
const upsertFavorite = vi.mocked(prisma.favorito.upsert);
const deleteFavorites = vi.mocked(prisma.favorito.deleteMany);
const findRequest = vi.mocked(prisma.solicitacaoAdocao.findFirst);
const findRequests = vi.mocked(prisma.solicitacaoAdocao.findMany);
const createRequest = vi.mocked(prisma.solicitacaoAdocao.create);

function session(overrides: Partial<Session["user"]> = {}): Session {
  return {
    expires: "2026-08-01T12:00:00.000Z",
    user: {
      id: userId,
      email: "adopter@example.com",
      name: null,
      image: null,
      tipoPerfil: TipoPerfil.ADOTANTE,
      ativo: true,
      adotanteId: adopterId,
      organizacaoId: null,
      acolhedorId: null,
      ...overrides,
    },
  };
}

const activeAdopter = {
  ativo: true,
  tipoPerfil: TipoPerfil.ADOTANTE,
  adotante: { id: adopterId },
};

const favoriteRecord = {
  animalId,
  criadoEm: new Date("2026-07-28T12:00:00.000Z"),
  animal: {
    id: animalId,
    nome: "Luna",
    status: StatusAnimal.DISPONIVEL,
    idadeEstimada: 2,
    especie: { nome: "Cachorro" },
    raca: { nome: "Sem raca definida" },
    porte: "M",
    sexo: "F",
    castrado: true,
    registrosSaude: [{ tipo: "VACINA" }],
    fotos: [{ urlFoto: "https://example.com/luna.jpg" }],
    organizacao: { id: "org-profile-1", razaoSocial: "Abrigo Legal", cidade: "Volta Redonda" },
    acolhedor: null,
  },
};

const requestRecord = {
  id: requestId,
  status: StatusSolicitacao.EM_ANALISE,
  dataSolicitacao: new Date("2026-07-28T12:00:00.000Z"),
  dataAtualizacao: new Date("2026-07-28T12:30:00.000Z"),
  observacoes: null,
  animal: {
    id: animalId,
    nome: "Luna",
    fotos: [{ urlFoto: "https://example.com/luna.jpg" }],
    organizacao: { razaoSocial: "Abrigo Legal" },
    acolhedor: null,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("adopter journey authorization", () => {
  it("returns 401 before reading favorites without a session", async () => {
    mockedGetServerSession.mockResolvedValue(null);

    const response = await getFavorites();

    expect(response.status).toBe(401);
    expect(findUser).not.toHaveBeenCalled();
    expect(findFavorite).not.toHaveBeenCalled();
  });

  it("blocks an account deactivated after its session was issued", async () => {
    mockedGetServerSession.mockResolvedValue(session());
    findUser.mockResolvedValue({ ...activeAdopter, ativo: false } as never);

    const response = await putFavorite(new Request("http://localhost"), {
      params: Promise.resolve({ animalId }),
    });

    expect(response.status).toBe(403);
    expect(upsertFavorite).not.toHaveBeenCalled();
  });

  it("blocks non-adopters before reading protected data", async () => {
    mockedGetServerSession.mockResolvedValue(
      session({
        tipoPerfil: TipoPerfil.ORGANIZACAO,
        adotanteId: null,
        organizacaoId: "cm00000000000000000000009",
      }),
    );
    findUser.mockResolvedValue({
      ativo: true,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      adotante: null,
    } as never);

    const response = await getRequests();

    expect(response.status).toBe(403);
    expect(findRequests).not.toHaveBeenCalled();
  });
});

describe("favorites contracts", () => {
  it("lists only the current adopter's allowlisted favorite DTOs", async () => {
    mockedGetServerSession.mockResolvedValue(session());
    findUser.mockResolvedValue(activeAdopter as never);
    findFavorite.mockResolvedValue([favoriteRecord] as never);

    const response = await getFavorites();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(findFavorite).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ adotanteId: adopterId }) }),
    );
    expect(body).toEqual({
      favorites: [
        {
          animalId,
          criadoEm: "2026-07-28T12:00:00.000Z",
          animal: {
            id: animalId,
            nome: "Luna",
            status: "DISPONIVEL",
            idadeEstimada: 2,
            especie: "Cachorro",
            raca: "Sem raca definida",
            porte: "M",
            sexo: "F",
            castrado: true,
            fotoPrincipal: "https://example.com/luna.jpg",
            responsavel: "Abrigo Legal",
            responsavelId: "org-profile-1",
            responsavelTipo: "ORGANIZACAO",
            cidade: "Volta Redonda",
            tags: expect.any(Array),
          },
        },
      ],
    });

    const serialized = JSON.stringify(body);
    for (const forbidden of [
      "adotanteId",
      "usuarioId",
      "cpf",
      "cnpj",
      "telefone",
      "email",
      "endereco",
      "registrosSaude",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("adds and removes a favorite idempotently for the session adopter", async () => {
    mockedGetServerSession.mockResolvedValue(session());
    findUser.mockResolvedValue(activeAdopter as never);
    findAnimal.mockResolvedValue({ id: animalId, status: "DISPONIVEL" } as never);
    upsertFavorite.mockResolvedValue({ adotanteId: adopterId, animalId } as never);
    deleteFavorites.mockResolvedValue({ count: 1 });

    const putResponse = await putFavorite(new Request("http://localhost"), {
      params: Promise.resolve({ animalId }),
    });
    const deleteResponse = await deleteFavorite(new Request("http://localhost"), {
      params: Promise.resolve({ animalId }),
    });

    expect(putResponse.status).toBe(200);
    expect(upsertFavorite).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { adotanteId_animalId: { adotanteId: adopterId, animalId } },
      }),
    );
    expect(deleteResponse.status).toBe(200);
    expect(deleteFavorites).toHaveBeenCalledWith({
      where: { adotanteId: adopterId, animalId },
    });
  });
});

describe("adoption request contracts", () => {
  it("rejects browser-supplied adopter identity before any write", async () => {
    mockedGetServerSession.mockResolvedValue(session());
    findUser.mockResolvedValue(activeAdopter as never);

    const response = await postRequest(
      new Request("http://localhost/api/solicitacoes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ animalId, adotanteId: "cm00000000000000000000099" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(createRequest).not.toHaveBeenCalled();
  });

  it("preserves screening, availability, and active-duplicate guards", async () => {
    mockedGetServerSession.mockResolvedValue(session());
    findUser.mockResolvedValue(activeAdopter as never);

    findAdopter.mockResolvedValueOnce({ triagemConcluida: false } as never);
    const screeningResponse = await postRequest(requestForAnimal());
    expect(screeningResponse.status).toBe(409);
    expect((await screeningResponse.json()).error.code).toBe("SCREENING_REQUIRED");

    findAdopter.mockResolvedValueOnce({ triagemConcluida: true } as never);
    findAnimal.mockResolvedValueOnce({ status: StatusAnimal.EM_CUIDADOS } as never);
    const unavailableResponse = await postRequest(requestForAnimal());
    expect(unavailableResponse.status).toBe(409);
    expect((await unavailableResponse.json()).error.code).toBe("ANIMAL_UNAVAILABLE");

    findAdopter.mockResolvedValueOnce({ triagemConcluida: true } as never);
    findAnimal.mockResolvedValueOnce({ status: StatusAnimal.DISPONIVEL } as never);
    findRequest.mockResolvedValueOnce({ id: requestId } as never);
    const duplicateResponse = await postRequest(requestForAnimal());
    expect(duplicateResponse.status).toBe(409);
    expect((await duplicateResponse.json()).error.code).toBe("ACTIVE_REQUEST_EXISTS");

    expect(createRequest).not.toHaveBeenCalled();
  });

  it("creates and lists requests only for the session adopter", async () => {
    mockedGetServerSession.mockResolvedValue(session());
    findUser.mockResolvedValue(activeAdopter as never);
    findAdopter.mockResolvedValue({ triagemConcluida: true } as never);
    findAnimal.mockResolvedValue({ status: StatusAnimal.DISPONIVEL } as never);
    findRequest.mockResolvedValue(null);
    createRequest.mockResolvedValue(requestRecord as never);

    const createResponse = await postRequest(requestForAnimal());
    const created = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(createRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          adotanteId: adopterId,
          animalId,
          status: StatusSolicitacao.EM_ANALISE,
        },
      }),
    );
    expect(created.request.id).toBe(requestId);

    findRequests.mockResolvedValue([requestRecord] as never);
    const listResponse = await getRequests();
    const listed = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(findRequests).toHaveBeenCalledWith(
      expect.objectContaining({ where: { adotanteId: adopterId } }),
    );
    expect(listed.requests[0]).toEqual({
      id: requestId,
      status: "EM_ANALISE",
      dataSolicitacao: "2026-07-28T12:00:00.000Z",
      dataAtualizacao: "2026-07-28T12:30:00.000Z",
      observacoes: null,
      animal: {
        id: animalId,
        nome: "Luna",
        fotoPrincipal: "https://example.com/luna.jpg",
        responsavel: "Abrigo Legal",
      },
    });
    expect(JSON.stringify(listed)).not.toContain("adotanteId");
  });
});

describe("adopter dashboard contract", () => {
  it("returns only the current adopter's dashboard status", async () => {
    mockedGetServerSession.mockResolvedValue(session());
    findUser.mockResolvedValue(activeAdopter as never);
    findAdopter.mockResolvedValue({
      id: adopterId,
      nomeCompleto: "Pessoa Adotante",
      triagemConcluida: true,
    } as never);

    const response = await getDashboard();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      dashboard: {
        id: adopterId,
        nomeCompleto: "Pessoa Adotante",
        triagemConcluida: true,
      },
    });
    expect(findAdopter).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: adopterId } }),
    );
  });
});

function requestForAnimal() {
  return new Request("http://localhost/api/solicitacoes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ animalId }),
  });
}
