import { StatusSolicitacao, TipoMoradia, TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/perfis/adotante/[id]/route";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const targetId = "cm00000000000000000000001";
const getSession = vi.mocked(getServerSession);
const findUser = vi.mocked(prisma.usuario.findUnique);
const findAdopter = vi.mocked(prisma.adotante.findUnique);
const findLink = vi.mocked(prisma.solicitacaoAdocao.findFirst);

const publicRow = {
  id: targetId,
  nomeCompleto: "Pessoa Adotante",
  cidade: "Volta Redonda",
  estado: "RJ",
  triagemConcluida: true,
  usuario: { ativo: true },
};

const restrictedRow = {
  ...publicRow,
  endereco: "Rua Privada, 20",
  cep: "27200-000",
  motivoAdocao: "Oferecer um lar",
  tipoAnimalDesejado: "Cachorro",
  podeArcarCustosVet: true,
  adocaoParaPresente: false,
  adocaoParaPresenteDetalhe: null,
  tipoMoradia: TipoMoradia.CASA,
  moradiaPropria: true,
  numAdultosCasa: 2,
  temCriancas: false,
  criancasFaixaEtaria: null,
  todosConordamAdocao: true,
  condominioPermiteAnimal: null,
  janelasTeladas: true,
  acessoRua: "Com guia",
  murosSeguros: true,
  horasSozinho: "4 horas",
  responsavelViagem: "Familia",
  planoEmGravidez: "Manter",
  alergicosNaCasa: false,
  alergicosNaCasaDetalhe: null,
  planoMudanca: "Levar",
  historicoDevolucao: "Nunca",
  historicoPercaDescuido: "Nunca",
  cienteLongevidade: true,
  permiteVisitaProtetor: true,
  ciendeNaoRepassar: true,
  teveAnimaisAntes: true,
  animaisAnterioresDescricao: null,
  temOutrosAnimais: false,
  outrosAnimaisDescricao: null,
};

function session(tipoPerfil: TipoPerfil, ids: Partial<Session["user"]> = {}): Session {
  return {
    expires: "2026-09-01T00:00:00.000Z",
    user: {
      id: "viewer-user",
      email: "viewer@example.com",
      name: null,
      image: null,
      tipoPerfil,
      ativo: true,
      adotanteId: null,
      organizacaoId: null,
      acolhedorId: null,
      ...ids,
    },
  };
}

function revalidatedViewer(viewer: Session) {
  return {
    id: viewer.user.id,
    ativo: true,
    tipoPerfil: viewer.user.tipoPerfil,
    adotante: viewer.user.adotanteId ? { id: viewer.user.adotanteId } : null,
    organizacao: viewer.user.organizacaoId ? { id: viewer.user.organizacaoId } : null,
    acolhedor: viewer.user.acolhedorId ? { id: viewer.user.acolhedorId } : null,
  };
}

async function requestProfile() {
  return GET(new Request(`http://localhost/api/perfis/adotante/${targetId}`), {
    params: Promise.resolve({ id: targetId }),
  });
}

function expectNoForbiddenKeys(value: unknown) {
  const forbidden = new Set([
    "cpf", "cnpj", "email", "telefone", "instagram", "latitude", "longitude",
    "precisaoCoordenada", "usuarioId", "senhaHash",
  ]);
  function visit(current: unknown) {
    if (!current || typeof current !== "object") return;
    for (const [key, nested] of Object.entries(current)) {
      expect(forbidden.has(key), `campo proibido: ${key}`).toBe(false);
      visit(nested);
    }
  }
  visit(value);
}

beforeEach(() => {
  vi.clearAllMocks();
  findAdopter.mockResolvedValue(publicRow as never);
});

describe("adopter profile authorization before sensitive selection", () => {
  it.each([
    ["visitante", null],
    ["outro adotante", session(TipoPerfil.ADOTANTE, { adotanteId: "other-adopter" })],
    ["responsavel sem vinculo", session(TipoPerfil.ORGANIZACAO, { organizacaoId: "org-1" })],
    ["responsavel de outra conta", session(TipoPerfil.ACOLHEDOR, { acolhedorId: "foster-2" })],
  ])("entrega somente PUBLIC para %s sem executar select sensivel", async (_label, viewer) => {
    getSession.mockResolvedValue(viewer);
    if (viewer) findUser.mockResolvedValue(revalidatedViewer(viewer) as never);
    findLink.mockResolvedValue(null);

    const response = await requestProfile();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.profile).toEqual({
      access: "PUBLIC",
      id: targetId,
      nome: "Pessoa Adotante",
      municipio: "Volta Redonda",
      uf: "RJ",
      triagemConcluida: true,
    });
    expect(findAdopter).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(findAdopter.mock.calls[0])).not.toContain("motivoAdocao");
    expect(body.profile).not.toHaveProperty("enderecoAnalise");
    expect(body.profile).not.toHaveProperty("triagem");
  });

  it.each([
    StatusSolicitacao.EM_ANALISE,
    StatusSolicitacao.APROVADA,
    StatusSolicitacao.RECUSADA,
    StatusSolicitacao.CONCLUIDA,
  ])("autoriza responsavel com solicitacao %s sem filtrar status", async (status) => {
    getSession.mockResolvedValue(session(TipoPerfil.ORGANIZACAO, { organizacaoId: "org-1" }));
    findUser.mockResolvedValue(revalidatedViewer(session(TipoPerfil.ORGANIZACAO, { organizacaoId: "org-1" })) as never);
    findLink.mockResolvedValue({ id: `request-${status}`, status } as never);
    findAdopter.mockResolvedValue(restrictedRow as never);

    const response = await requestProfile();
    const body = await response.json();
    expect(body.profile.access).toBe("RESTRICTED");
    expect(body.profile.enderecoAnalise.endereco).toBe("Rua Privada, 20");
    expect(JSON.stringify(findLink.mock.calls[0])).not.toContain("status");
  });

  it.each([
    ["proprio adotante", session(TipoPerfil.ADOTANTE, { adotanteId: targetId })],
    ["administracao", session(TipoPerfil.ADMIN)],
  ])("autoriza %s", async (_label, viewer) => {
    getSession.mockResolvedValue(viewer);
    findUser.mockResolvedValue(revalidatedViewer(viewer) as never);
    findAdopter.mockResolvedValue(restrictedRow as never);
    const body = await (await requestProfile()).json();
    expect(body.profile.access).toBe("RESTRICTED");
    expect(findLink).not.toHaveBeenCalled();
  });

  it("proibe telefone e identificadores nas duas projecoes", async () => {
    getSession.mockResolvedValue(null);
    let body = await (await requestProfile()).json();
    expectNoForbiddenKeys(body);
    getSession.mockResolvedValue(session(TipoPerfil.ADMIN));
    findUser.mockResolvedValue(revalidatedViewer(session(TipoPerfil.ADMIN)) as never);
    findAdopter.mockResolvedValue(restrictedRow as never);
    body = await (await requestProfile()).json();
    expectNoForbiddenKeys(body);
  });
});
