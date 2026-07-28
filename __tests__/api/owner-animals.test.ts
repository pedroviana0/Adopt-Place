import { StatusAnimal, TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET as getOwnedAnimals,
  POST as postOwnedAnimal,
} from "@/app/api/animais/gerenciados/route";
import { GET as getOwnedAnimal } from "@/app/api/animais/gerenciados/[id]/route";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const userId = "cm00000000000000000000001";
const organizacaoId = "cm00000000000000000000002";
const animalId = "cm00000000000000000000003";
const especieId = "cm00000000000000000000004";
const racaId = "cm00000000000000000000005";

function session(): Session {
  return {
    expires: "2026-08-01T12:00:00.000Z",
    user: {
      id: userId,
      email: "org@example.com",
      name: "Organizacao",
      image: null,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      ativo: true,
      adotanteId: null,
      organizacaoId,
      acolhedorId: null,
    },
  };
}

function activeOrganization() {
  vi.mocked(getServerSession).mockResolvedValue(session());
  vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
    ativo: true,
    tipoPerfil: TipoPerfil.ORGANIZACAO,
    organizacao: { id: organizacaoId },
    acolhedor: null,
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("owner animal HTTP contracts", () => {
  it("returns 401 without querying animals when there is no session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await getOwnedAnimals(
      new Request("http://localhost/api/animais/gerenciados"),
    );

    expect(response.status).toBe(401);
    expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
    expect(prisma.animal.findMany).not.toHaveBeenCalled();
  });

  it("blocks an account deactivated after session issuance", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session());
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      ativo: false,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      organizacao: { id: organizacaoId },
      acolhedor: null,
    } as never);

    const response = await getOwnedAnimals(
      new Request("http://localhost/api/animais/gerenciados"),
    );

    expect(response.status).toBe(403);
    expect(prisma.animal.findMany).not.toHaveBeenCalled();
  });

  it("combines search filters with the current organization ownership", async () => {
    activeOrganization();
    vi.mocked(prisma.animal.findMany).mockResolvedValue([]);

    const response = await getOwnedAnimals(
      new Request(
        `http://localhost/api/animais/gerenciados?q=luna&status=DISPONIVEL&especieId=${especieId}&racaId=${racaId}&porte=M&sexo=F`,
      ),
    );

    expect(response.status).toBe(200);
    expect(prisma.animal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizacaoId,
          nome: { contains: "luna", mode: "insensitive" },
          status: StatusAnimal.DISPONIVEL,
          especieId,
          racaId,
          porte: "M",
          sexo: "F",
        },
      }),
    );
  });

  it("returns an allowlisted DTO without owner or private account fields", async () => {
    activeOrganization();
    vi.mocked(prisma.animal.findMany).mockResolvedValue([
      {
        id: animalId,
        nome: "Luna",
        status: StatusAnimal.DISPONIVEL,
        porte: "M",
        sexo: "F",
        cor: "Caramelo",
        idadeEstimada: "2 anos",
        castrado: true,
        especie: { id: especieId, nome: "Cachorro" },
        raca: { id: racaId, nome: "Sem raca definida" },
        fotos: [],
        _count: { solicitacoes: 0 },
      },
    ] as never);

    const response = await getOwnedAnimals(
      new Request("http://localhost/api/animais/gerenciados"),
    );
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(body.animals[0]).toEqual({
      id: animalId,
      nome: "Luna",
      status: "DISPONIVEL",
      porte: "M",
      sexo: "F",
      cor: "Caramelo",
      idadeEstimada: "2 anos",
      castrado: true,
      especie: { id: especieId, nome: "Cachorro" },
      raca: { id: racaId, nome: "Sem raca definida" },
      fotoPrincipal: null,
      solicitacoesEmAnalise: 0,
    });
    for (const forbidden of [
      "organizacaoId",
      "acolhedorId",
      "usuarioId",
      "email",
      "telefone",
      "endereco",
      "cnpj",
      "cpf",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("rejects owner identifiers supplied by the browser", async () => {
    activeOrganization();

    const response = await postOwnedAnimal(
      new Request("http://localhost/api/animais/gerenciados", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nome: "Luna",
          especieId,
          porte: "M",
          sexo: "F",
          cor: "Caramelo",
          castrado: true,
          status: "RESGATADO",
          organizacaoId,
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(prisma.animal.create).not.toHaveBeenCalled();
  });

  it("does not reveal an animal outside the current owner scope", async () => {
    activeOrganization();
    vi.mocked(prisma.animal.findFirst).mockResolvedValue(null);

    const response = await getOwnedAnimal(new Request("http://localhost"), {
      params: Promise.resolve({ id: animalId }),
    });

    expect(response.status).toBe(404);
    expect(prisma.animal.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: animalId, organizacaoId },
      }),
    );
  });
});
