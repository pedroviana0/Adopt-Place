import { PrecisaoCoordenada, TipoPerfil } from "@prisma/client";
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
const findMunicipio = vi.mocked(prisma.municipio.findUnique);
const createUser = vi.mocked(prisma.usuario.create);

const CEP = "27255000";

const voltaRedonda = {
  codigoIbge: "3306305",
  nome: "Volta Redonda",
  uf: "RJ",
  latitude: -22.5202,
  longitude: -44.0996,
};

/** Resposta da BrasilAPI para um CEP existente. */
function cepEncontrado() {
  return new Response(
    JSON.stringify({
      cep: CEP,
      state: "RJ",
      city: "Volta Redonda",
      neighborhood: "Laranjal",
      street: "Rua Cem",
      ibge: { city: voltaRedonda.codigoIbge },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

function mockCepOk() {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(cepEncontrado()));
  findMunicipio.mockResolvedValue(voltaRedonda as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("POST /api/cadastro/[tipo]", () => {
  it("creates an organization through a safe nested write and returns no credential", async () => {
    mockCepOk();
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
          cnpj: "04252011000110",
          telefone: "24999999999",
          endereco: "Rua A",
          cep: "27255-000",
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
              cnpj: "04252011000110",
              // Cidade, UF e coordenada sao derivadas pelo servidor.
              cep: CEP,
              cidade: "Volta Redonda",
              estado: "RJ",
              municipioId: voltaRedonda.codigoIbge,
              latitude: voltaRedonda.latitude,
              longitude: voltaRedonda.longitude,
              precisaoCoordenada: PrecisaoCoordenada.MUNICIPIO,
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
    mockCepOk();
    findUser.mockResolvedValue({ id: "existing-user" } as never);

    const response = await POST(
      new Request("http://localhost/api/cadastro/adotante", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "existing@example.com",
          password: "senha123",
          nomeCompleto: "Pessoa Adotante",
          cpf: "52998224725",
          telefone: "24999999999",
          endereco: "Rua A",
          cep: CEP,
        }),
      }),
      { params: Promise.resolve({ tipo: "adotante" }) },
    );

    expect(response.status).toBe(409);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("rejects account-control fields before writing", async () => {
    mockCepOk();

    const response = await POST(
      new Request("http://localhost/api/cadastro/adotante", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "adopter@example.com",
          password: "senha123",
          nomeCompleto: "Pessoa Adotante",
          cpf: "52998224725",
          telefone: "24999999999",
          endereco: "Rua A",
          cep: CEP,
          ativo: true,
          tipoPerfil: TipoPerfil.ADMIN,
        }),
      }),
      { params: Promise.resolve({ tipo: "adotante" }) },
    );

    expect(response.status).toBe(400);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("rejects a body that still sends cidade and estado, agora derivados", async () => {
    mockCepOk();

    const response = await POST(
      new Request("http://localhost/api/cadastro/adotante", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "adopter@example.com",
          password: "senha123",
          nomeCompleto: "Pessoa Adotante",
          cpf: "52998224725",
          telefone: "24999999999",
          endereco: "Rua A",
          cep: CEP,
          cidade: "Cidade Inventada",
          estado: "SP",
        }),
      }),
      { params: Promise.resolve({ tipo: "adotante" }) },
    );

    expect(response.status).toBe(400);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("creates a foster account without exposing credentials", async () => {
    mockCepOk();
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
          cpf: "52998224725",
          telefone: "24999999999",
          endereco: "Rua A",
          cep: CEP,
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
              cpf: "52998224725",
              estado: "RJ",
              municipioId: voltaRedonda.codigoIbge,
            }),
          },
        }),
      }),
    );
    expect(JSON.stringify(body)).not.toContain("senha");
    expect(JSON.stringify(body)).not.toContain("password");
  });
});

describe("localizacao no cadastro", () => {
  const corpoAdotante = (extra: Record<string, unknown> = {}) => ({
    email: "adopter@example.com",
    password: "senha123",
    nomeCompleto: "Pessoa Adotante",
    cpf: "52998224725",
    telefone: "24999999999",
    endereco: "Rua A",
    cep: CEP,
    ...extra,
  });

  const enviar = (corpo: Record<string, unknown>) =>
    POST(
      new Request("http://localhost/api/cadastro/adotante", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(corpo),
      }),
      { params: Promise.resolve({ tipo: "adotante" }) },
    );

  beforeEach(() => {
    findUser.mockResolvedValue(null);
    findAdopter.mockResolvedValue(null);
    findFoster.mockResolvedValue(null);
  });

  it("recusa CEP inexistente apontando para o campo, sem gravar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 404 })),
    );

    const response = await enviar(corpoAdotante());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("CEP_NOT_FOUND");
    expect(body.error.fieldErrors.cep).toBeDefined();
    expect(createUser).not.toHaveBeenCalled();
  });

  it("recusa CEP malformado na validacao, antes de qualquer chamada externa", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const response = await enviar(corpoAdotante({ cep: "123" }));

    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
  });

  it("pede a escolha de municipio quando o provedor esta fora do ar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNRESET")));

    const response = await enviar(corpoAdotante());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("CEP_SERVICE_UNAVAILABLE");
    expect(createUser).not.toHaveBeenCalled();
  });

  it("conclui com o municipio escolhido quando o provedor esta fora do ar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNRESET")));
    findMunicipio.mockResolvedValue(voltaRedonda as never);
    createUser.mockResolvedValue({
      id: "user-adopter",
      email: "adopter@example.com",
      tipoPerfil: TipoPerfil.ADOTANTE,
      ativo: true,
      adotante: { id: "adopter-1" },
    } as never);

    const response = await enviar(
      corpoAdotante({ municipioId: voltaRedonda.codigoIbge }),
    );

    expect(response.status).toBe(201);
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adotante: {
            create: expect.objectContaining({
              // Mesma coordenada que o caminho do CEP produziria: o provedor
              // nunca foi a fonte dela.
              latitude: voltaRedonda.latitude,
              longitude: voltaRedonda.longitude,
              municipioId: voltaRedonda.codigoIbge,
            }),
          },
        }),
      }),
    );
  });

  it("recusa municipio que nao existe na nossa base", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNRESET")));
    findMunicipio.mockResolvedValue(null);

    const response = await enviar(corpoAdotante({ municipioId: "9999999" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("MUNICIPALITY_NOT_FOUND");
    expect(createUser).not.toHaveBeenCalled();
  });
});
