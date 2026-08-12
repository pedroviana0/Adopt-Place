import { StatusAnimal, TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getFeels } from "@/app/api/feels/route";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const userId = "cm00000000000000000000001";
const adopterId = "cm00000000000000000000002";

const activeSession: Session = {
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
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/feels", () => {
  it("entrega referência navegável sem identidade privada do acolhedor", async () => {
    vi.mocked(getServerSession).mockResolvedValue(activeSession);
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      ativo: true,
      tipoPerfil: TipoPerfil.ADOTANTE,
      adotante: { id: adopterId },
    } as never);
    vi.mocked(prisma.adotante.findUnique).mockResolvedValue({
      cidade: "Volta Redonda",
      estado: "RJ",
      latitude: -22.52,
      longitude: -44.1,
    } as never);
    vi.mocked(prisma.favorito.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.solicitacaoAdocao.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.animal.findMany).mockResolvedValue([
      {
        id: "animal-1",
        nome: "Luna",
        porte: "P",
        sexo: "F",
        idadeEstimada: "2 anos",
        castrado: true,
        status: StatusAnimal.DISPONIVEL,
        fotos: [],
        especie: { nome: "Gato" },
        raca: null,
        registrosSaude: [],
        organizacao: null,
        acolhedor: {
          id: "foster-profile-1",
          cidade: "Volta Redonda",
          estado: "RJ",
          latitude: -22.52,
          longitude: -44.1,
        },
      },
    ] as never);

    const response = await getFeels(new Request("http://localhost/api/feels"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.cartoes[0]).toMatchObject({
      responsavel: { tipo: "ACOLHEDOR", nome: null },
      responsavelId: "foster-profile-1",
      responsavelTipo: "ACOLHEDOR",
    });
    const serialized = JSON.stringify(body);
    for (const forbidden of [
      "nomeCompleto",
      "cpf",
      "cnpj",
      "email",
      "telefone",
      "endereco",
      "latitude",
      "longitude",
      "usuarioId",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
