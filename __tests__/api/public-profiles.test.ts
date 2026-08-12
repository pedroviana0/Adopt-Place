import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getOrganizationProfile } from "@/app/api/perfis/organizacao/[id]/route";
import { prisma } from "@/lib/prisma";

const organizationId = "cm00000000000000000000010";
const findOrganization = vi.mocked(prisma.organizacao.findFirst);
const findAnimals = vi.mocked(prisma.animal.findMany);
const countAnimals = vi.mocked(prisma.animal.count);
const findSpecies = vi.mocked(prisma.especie.findMany);
const findBreeds = vi.mocked(prisma.raca.findMany);

const organization = {
  id: organizationId,
  razaoSocial: "Proteção Animal",
  descricao: "Atuação regional.",
  fotoUrl: "https://cdn.example.com/profile.jpg",
  endereco: "Rua Exemplo, 10",
  cidade: "Volta Redonda",
  estado: "RJ",
};

const animal = {
  id: "cm00000000000000000000020",
  nome: "Luna",
  porte: "M",
  sexo: "F",
  idadeEstimada: "2 anos",
  castrado: true,
  status: "DISPONIVEL",
  fotos: [{ urlFoto: "/luna.jpg" }],
  especie: { nome: "Cachorro" },
  raca: { nome: "Sem raça definida (SRD)" },
  registrosSaude: [{ tipo: "VACINA" }],
};

function collectKeys(value: unknown): Set<string> {
  const keys = new Set<string>();
  const visit = (current: unknown): void => {
    if (!current || typeof current !== "object") return;
    if (Array.isArray(current)) return current.forEach(visit);
    for (const [key, nested] of Object.entries(current)) {
      keys.add(key);
      visit(nested);
    }
  };
  visit(value);
  return keys;
}

function mockSuccessfulQueries() {
  findOrganization.mockResolvedValue(organization as never);
  findAnimals.mockResolvedValue([animal] as never);
  countAnimals.mockResolvedValue(1 as never);
  findSpecies.mockResolvedValue([{ id: "species-1", nome: "Cachorro" }] as never);
  findBreeds.mockResolvedValue([
    { id: "breed-1", nome: "Sem raça definida (SRD)", especieId: "species-1" },
  ] as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/perfis/organizacao/[id]", () => {
  it("devolve somente o perfil institucional e catálogo permitidos", async () => {
    mockSuccessfulQueries();

    const response = await getOrganizationProfile(
      new Request(`http://localhost/api/perfis/organizacao/${organizationId}`),
      { params: Promise.resolve({ id: organizationId }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      profile: {
        id: organizationId,
        tipo: "ORGANIZACAO",
        nome: "Proteção Animal",
        descricao: "Atuação regional.",
        fotoUrl: "https://cdn.example.com/profile.jpg",
        municipio: "Volta Redonda",
        uf: "RJ",
        endereco: "Rua Exemplo, 10",
      },
      catalog: {
        animals: [
          expect.objectContaining({
            id: animal.id,
            nome: "Luna",
            fotoPrincipal: "/luna.jpg",
            responsavel: "Proteção Animal",
            cidade: "Volta Redonda",
          }),
        ],
        filterOptions: {
          especies: [{ id: "species-1", nome: "Cachorro" }],
          racas: [
            { id: "breed-1", nome: "Sem raça definida (SRD)", especieId: "species-1" },
          ],
        },
        pagination: { page: 1, perPage: 30, total: 1, totalPages: 1 },
      },
    });

    const keys = collectKeys(body);
    for (const forbidden of [
      "cpf",
      "cnpj",
      "email",
      "telefone",
      "latitude",
      "longitude",
      "precisaoCoordenada",
      "usuarioId",
    ]) {
      expect(keys.has(forbidden), `${forbidden} leaked`).toBe(false);
    }
  });

  it("filtra conta ativa na consulta antes de formar a resposta", async () => {
    mockSuccessfulQueries();

    await getOrganizationProfile(
      new Request(`http://localhost/api/perfis/organizacao/${organizationId}`),
      { params: Promise.resolve({ id: organizationId }) },
    );

    expect(findOrganization).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: organizationId, usuario: { ativo: true } },
      }),
    );
  });

  it("usa o mesmo 404 para perfil inexistente e conta desativada", async () => {
    findOrganization.mockResolvedValue(null as never);

    const missing = await getOrganizationProfile(
      new Request(`http://localhost/api/perfis/organizacao/${organizationId}`),
      { params: Promise.resolve({ id: organizationId }) },
    );
    const inactive = await getOrganizationProfile(
      new Request(`http://localhost/api/perfis/organizacao/${organizationId}`),
      { params: Promise.resolve({ id: organizationId }) },
    );

    expect(missing.status).toBe(404);
    expect(inactive.status).toBe(404);
    expect(await inactive.json()).toEqual(await missing.json());
    expect(findAnimals).not.toHaveBeenCalled();
  });

  it("rejeita ID inválido antes de consultar o banco", async () => {
    const response = await getOrganizationProfile(
      new Request("http://localhost/api/perfis/organizacao/invalido"),
      { params: Promise.resolve({ id: "invalido" }) },
    );

    expect(response.status).toBe(400);
    expect(findOrganization).not.toHaveBeenCalled();
  });

  it("rejeita filtro com ID inválido antes de consultar o banco", async () => {
    const response = await getOrganizationProfile(
      new Request(
        `http://localhost/api/perfis/organizacao/${organizationId}?especieId=invalido`,
      ),
      { params: Promise.resolve({ id: organizationId }) },
    );

    expect(response.status).toBe(400);
    expect(findOrganization).not.toHaveBeenCalled();
  });
});
