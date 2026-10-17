import { SituacaoLT, TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET as getFosterHomes,
  POST as postFosterHome,
} from "@/app/api/lares-temporarios/route";
import {
  DELETE as deleteFosterHome,
  GET as getFosterHome,
  PATCH as patchFosterHome,
} from "@/app/api/lares-temporarios/[id]/route";
import { POST as linkAnimal } from "@/app/api/lares-temporarios/[id]/animais/route";
import { DELETE as unlinkAnimal } from "@/app/api/lares-temporarios/[id]/animais/[animalId]/route";
import { GET as getLinkable } from "@/app/api/lares-temporarios/vinculaveis/route";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const userId = "cm00000000000000000000001";
const organizacaoId = "cm00000000000000000000002";
const acolhedorId = "cm00000000000000000000003";
const larTemporarioId = "cm00000000000000000000010";
const animalId = "cm00000000000000000000020";

const validBody = {
  nomeTutor: "Maria Souza",
  telefone: "(24) 99999-8888",
  endereco: "Rua das Flores, 10",
  cidade: "Volta Redonda",
  observacoes: "Aceita só gatos",
  autorizacaoTutor: true,
};

function session(tipoPerfil: TipoPerfil): Session {
  return {
    expires: "2026-12-01T12:00:00.000Z",
    user: {
      id: userId,
      email: "responsavel@example.com",
      name: "Responsavel",
      image: null,
      tipoPerfil,
      ativo: true,
      adotanteId: null,
      organizacaoId: tipoPerfil === TipoPerfil.ORGANIZACAO ? organizacaoId : null,
      acolhedorId: tipoPerfil === TipoPerfil.ACOLHEDOR ? acolhedorId : null,
    },
  };
}

function activeOrganization() {
  vi.mocked(getServerSession).mockResolvedValue(session(TipoPerfil.ORGANIZACAO));
  vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
    ativo: true,
    tipoPerfil: TipoPerfil.ORGANIZACAO,
    organizacao: { id: organizacaoId },
    acolhedor: null,
  } as never);
}

function activeFoster() {
  vi.mocked(getServerSession).mockResolvedValue(session(TipoPerfil.ACOLHEDOR));
  vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
    ativo: true,
    tipoPerfil: TipoPerfil.ACOLHEDOR,
    organizacao: null,
    acolhedor: { id: acolhedorId },
  } as never);
}

function jsonRequest(url: string, method: string, body: unknown): Request {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const idParams = { params: Promise.resolve({ id: larTemporarioId }) };
const linkParams = {
  params: Promise.resolve({ id: larTemporarioId, animalId }),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("lares temporarios: cadastro e autorizacao (spec 009)", () => {
  it("responde 403 ao acolhedor sem consultar lares temporarios", async () => {
    activeFoster();

    const response = await getFosterHomes();

    expect(response.status).toBe(403);
    expect(prisma.larTemporario.findMany).not.toHaveBeenCalled();
  });

  it("responde 403 ao acolhedor no cadastro", async () => {
    activeFoster();

    const response = await postFosterHome(
      jsonRequest("http://localhost/api/lares-temporarios", "POST", validBody),
    );

    expect(response.status).toBe(403);
    expect(prisma.larTemporario.create).not.toHaveBeenCalled();
  });

  it("lista so os lares da propria organizacao", async () => {
    activeOrganization();
    vi.mocked(prisma.larTemporario.findMany).mockResolvedValue([]);

    const response = await getFosterHomes();

    expect(response.status).toBe(200);
    expect(prisma.larTemporario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizacaoId } }),
    );
  });

  it("recusa cadastro sem a autorizacao do tutor", async () => {
    activeOrganization();
    const { autorizacaoTutor: _omitida, ...semAutorizacao } = validBody;

    const response = await postFosterHome(
      jsonRequest("http://localhost/api/lares-temporarios", "POST", semAutorizacao),
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.fieldErrors.autorizacaoTutor).toBeDefined();
    expect(prisma.larTemporario.create).not.toHaveBeenCalled();
  });

  it("recusa telefone invalido", async () => {
    activeOrganization();

    const response = await postFosterHome(
      jsonRequest("http://localhost/api/lares-temporarios", "POST", {
        ...validBody,
        telefone: "123",
      }),
    );

    expect(response.status).toBe(400);
    expect(prisma.larTemporario.create).not.toHaveBeenCalled();
  });

  it("recusa organizacaoId enviado pelo navegador", async () => {
    activeOrganization();

    const response = await postFosterHome(
      jsonRequest("http://localhost/api/lares-temporarios", "POST", {
        ...validBody,
        organizacaoId: "cm00000000000000000000099",
      }),
    );

    expect(response.status).toBe(400);
    expect(prisma.larTemporario.create).not.toHaveBeenCalled();
  });

  it("cria com a organizacao da sessao e sem persistir a autorizacao", async () => {
    activeOrganization();
    vi.mocked(prisma.larTemporario.create).mockResolvedValue({
      id: larTemporarioId,
    } as never);

    const response = await postFosterHome(
      jsonRequest("http://localhost/api/lares-temporarios", "POST", validBody),
    );

    expect(response.status).toBe(201);
    expect(prisma.larTemporario.create).toHaveBeenCalledWith({
      data: {
        nomeTutor: "Maria Souza",
        telefone: "24999998888",
        endereco: "Rua das Flores, 10",
        cidade: "Volta Redonda",
        observacoes: "Aceita só gatos",
        organizacaoId,
      },
      select: { id: true },
    });
  });

  it("responde 404 ao ler LT de outra organizacao", async () => {
    activeOrganization();
    vi.mocked(prisma.larTemporario.findFirst).mockResolvedValue(null);

    const response = await getFosterHome(
      new Request(`http://localhost/api/lares-temporarios/${larTemporarioId}`),
      idParams,
    );

    expect(response.status).toBe(404);
    expect(prisma.larTemporario.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: larTemporarioId, organizacaoId } }),
    );
  });

  it("responde 404 ao editar LT de outra organizacao", async () => {
    activeOrganization();
    vi.mocked(prisma.larTemporario.updateMany).mockResolvedValue({ count: 0 });
    const { autorizacaoTutor: _omitida, ...edicao } = validBody;

    const response = await patchFosterHome(
      jsonRequest(`http://localhost/api/lares-temporarios/${larTemporarioId}`, "PATCH", edicao),
      idParams,
    );

    expect(response.status).toBe(404);
    expect(prisma.larTemporario.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: larTemporarioId, organizacaoId } }),
    );
  });

  it("responde 404 ao excluir LT de outra organizacao", async () => {
    activeOrganization();
    vi.mocked(prisma.larTemporario.deleteMany).mockResolvedValue({ count: 0 });

    const response = await deleteFosterHome(
      new Request(`http://localhost/api/lares-temporarios/${larTemporarioId}`, {
        method: "DELETE",
      }),
      idParams,
    );

    expect(response.status).toBe(404);
  });
});

describe("lares temporarios: vinculo e exclusao (spec 009)", () => {
  it("lista como vinculaveis so animais da ONG em EM_LT sem vinculo", async () => {
    activeOrganization();
    vi.mocked(prisma.animal.findMany).mockResolvedValue([]);

    const response = await getLinkable();

    expect(response.status).toBe(200);
    expect(prisma.animal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizacaoId,
          situacaoLT: SituacaoLT.EM_LT,
          larTemporarioId: null,
        },
      }),
    );
  });

  it("vincula com update condicional ao estado EM_LT sem vinculo", async () => {
    activeOrganization();
    vi.mocked(prisma.larTemporario.findFirst).mockResolvedValue({
      id: larTemporarioId,
    } as never);
    vi.mocked(prisma.animal.updateMany).mockResolvedValue({ count: 1 });

    const response = await linkAnimal(
      jsonRequest(
        `http://localhost/api/lares-temporarios/${larTemporarioId}/animais`,
        "POST",
        { animalId },
      ),
      idParams,
    );

    expect(response.status).toBe(200);
    expect(prisma.animal.updateMany).toHaveBeenCalledWith({
      where: {
        id: animalId,
        organizacaoId,
        situacaoLT: SituacaoLT.EM_LT,
        larTemporarioId: null,
      },
      data: { larTemporarioId },
    });
  });

  it("responde 409 quando o animal nao e vinculavel", async () => {
    activeOrganization();
    vi.mocked(prisma.larTemporario.findFirst).mockResolvedValue({
      id: larTemporarioId,
    } as never);
    vi.mocked(prisma.animal.updateMany).mockResolvedValue({ count: 0 });

    const response = await linkAnimal(
      jsonRequest(
        `http://localhost/api/lares-temporarios/${larTemporarioId}/animais`,
        "POST",
        { animalId },
      ),
      idParams,
    );
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error.code).toBe("INVALID_TRANSITION");
  });

  it("responde 404 ao vincular em LT de outra organizacao", async () => {
    activeOrganization();
    vi.mocked(prisma.larTemporario.findFirst).mockResolvedValue(null);

    const response = await linkAnimal(
      jsonRequest(
        `http://localhost/api/lares-temporarios/${larTemporarioId}/animais`,
        "POST",
        { animalId },
      ),
      idParams,
    );

    expect(response.status).toBe(404);
    expect(prisma.animal.updateMany).not.toHaveBeenCalled();
  });

  it("desvincula mantendo a situacao EM_LT", async () => {
    activeOrganization();
    vi.mocked(prisma.animal.updateMany).mockResolvedValue({ count: 1 });

    const response = await unlinkAnimal(
      new Request(
        `http://localhost/api/lares-temporarios/${larTemporarioId}/animais/${animalId}`,
        { method: "DELETE" },
      ),
      linkParams,
    );

    expect(response.status).toBe(200);
    expect(prisma.animal.updateMany).toHaveBeenCalledWith({
      where: { id: animalId, organizacaoId, larTemporarioId },
      data: { larTemporarioId: null },
    });
  });

  it("responde 404 ao desvincular animal que nao esta neste LT", async () => {
    activeOrganization();
    vi.mocked(prisma.animal.updateMany).mockResolvedValue({ count: 0 });

    const response = await unlinkAnimal(
      new Request(
        `http://localhost/api/lares-temporarios/${larTemporarioId}/animais/${animalId}`,
        { method: "DELETE" },
      ),
      linkParams,
    );

    expect(response.status).toBe(404);
  });

  it("exclui filtrando pela organizacao da sessao", async () => {
    activeOrganization();
    vi.mocked(prisma.larTemporario.deleteMany).mockResolvedValue({ count: 1 });

    const response = await deleteFosterHome(
      new Request(`http://localhost/api/lares-temporarios/${larTemporarioId}`, {
        method: "DELETE",
      }),
      idParams,
    );

    expect(response.status).toBe(200);
    expect(prisma.larTemporario.deleteMany).toHaveBeenCalledWith({
      where: { id: larTemporarioId, organizacaoId },
    });
  });
});
