import { Prisma, StatusAnimal, TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";

import { SHOWCASE_PAGE_SIZE } from "@/lib/queries/animal-showcase";
import { prisma } from "@/lib/prisma";
import type { PublicProfileCatalogFilters } from "@/lib/schemas/public-profiles";
import { getAnimalTags } from "@/lib/tags";
import type { AdopterProfileDTO } from "@/lib/schemas/public-profiles";
import { normalizarNomeMunicipio } from "@/lib/municipios";
import { formatPublicFosterName } from "@/lib/public-profile-name";

const publicOrganizationSelect = {
  id: true,
  razaoSocial: true,
  descricao: true,
  fotoUrl: true,
  endereco: true,
  cidade: true,
  estado: true,
} satisfies Prisma.OrganizacaoSelect;

const publicCatalogAnimalSelect = {
  id: true,
  nome: true,
  porte: true,
  sexo: true,
  idadeEstimada: true,
  castrado: true,
  status: true,
  fotos: {
    orderBy: [{ principal: "desc" }, { ordem: "asc" }],
    take: 1,
    select: { urlFoto: true },
  },
  especie: { select: { nome: true } },
  raca: { select: { nome: true } },
  registrosSaude: { select: { tipo: true } },
} satisfies Prisma.AnimalSelect;

export async function getPublicOrganizationProfile(
  id: string,
  filters: PublicProfileCatalogFilters,
) {
  const organization = await prisma.organizacao.findFirst({
    where: { id, usuario: { ativo: true } },
    select: publicOrganizationSelect,
  });

  if (!organization) return null;

  const where: Prisma.AnimalWhereInput = {
    organizacaoId: id,
    status: StatusAnimal.DISPONIVEL,
    especieId: filters.especieId,
    racaId: filters.racaId,
    porte: filters.porte,
    sexo: filters.sexo,
  };
  const availableOwnerScope: Prisma.AnimalWhereInput = {
    organizacaoId: id,
    status: StatusAnimal.DISPONIVEL,
  };
  const skip = (filters.page - 1) * SHOWCASE_PAGE_SIZE;

  const [animals, total, especies, racas] = await prisma.$transaction([
    prisma.animal.findMany({
      where,
      orderBy: [{ criadoEm: "desc" }, { nome: "asc" }],
      skip,
      take: SHOWCASE_PAGE_SIZE,
      select: publicCatalogAnimalSelect,
    }),
    prisma.animal.count({ where }),
    prisma.especie.findMany({
      where: { animais: { some: availableOwnerScope } },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
    prisma.raca.findMany({
      where: { animais: { some: availableOwnerScope } },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, especieId: true },
    }),
  ]);

  return {
    profile: {
      id: organization.id,
      tipo: "ORGANIZACAO" as const,
      nome: organization.razaoSocial,
      descricao: organization.descricao,
      fotoUrl: organization.fotoUrl,
      municipio: organization.cidade,
      uf: organization.estado,
      endereco: organization.endereco,
    },
    catalog: {
      animals: animals.map((animal) => ({
        id: animal.id,
        nome: animal.nome,
        porte: animal.porte,
        sexo: animal.sexo,
        idadeEstimada: animal.idadeEstimada,
        castrado: animal.castrado,
        status: animal.status,
        fotoPrincipal: animal.fotos[0]?.urlFoto ?? null,
        especie: animal.especie?.nome ?? null,
        raca: animal.raca?.nome ?? null,
        cidade: organization.cidade,
        responsavel: organization.razaoSocial,
        responsavelId: organization.id,
        responsavelTipo: "ORGANIZACAO" as const,
        tags: getAnimalTags(animal),
      })),
      filterOptions: { especies, racas },
      pagination: {
        page: filters.page,
        perPage: SHOWCASE_PAGE_SIZE,
        total,
        totalPages: Math.max(1, Math.ceil(total / SHOWCASE_PAGE_SIZE)),
      },
    },
  };
}

const publicFosterSelect = {
  id: true,
  nomeCompleto: true,
  descricao: true,
  fotoUrl: true,
  cidade: true,
  estado: true,
} satisfies Prisma.AcolhedorIndependenteSelect;

export async function getPublicFosterProfile(
  id: string,
  filters: PublicProfileCatalogFilters,
) {
  const foster = await prisma.acolhedorIndependente.findFirst({
    where: { id, usuario: { ativo: true } },
    select: publicFosterSelect,
  });
  if (!foster) return null;

  const where: Prisma.AnimalWhereInput = {
    acolhedorId: id,
    status: StatusAnimal.DISPONIVEL,
    especieId: filters.especieId,
    racaId: filters.racaId,
    porte: filters.porte,
    sexo: filters.sexo,
  };
  const availableOwnerScope: Prisma.AnimalWhereInput = {
    acolhedorId: id,
    status: StatusAnimal.DISPONIVEL,
  };
  const skip = (filters.page - 1) * SHOWCASE_PAGE_SIZE;
  const [animals, total, especies, racas] = await prisma.$transaction([
    prisma.animal.findMany({
      where,
      orderBy: [{ criadoEm: "desc" }, { nome: "asc" }],
      skip,
      take: SHOWCASE_PAGE_SIZE,
      select: publicCatalogAnimalSelect,
    }),
    prisma.animal.count({ where }),
    prisma.especie.findMany({
      where: { animais: { some: availableOwnerScope } },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
    prisma.raca.findMany({
      where: { animais: { some: availableOwnerScope } },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, especieId: true },
    }),
  ]);
  const publicName = formatPublicFosterName(foster.nomeCompleto);

  return {
    profile: {
      id: foster.id,
      tipo: "ACOLHEDOR" as const,
      nome: publicName,
      descricao: foster.descricao,
      fotoUrl: foster.fotoUrl,
      municipio: foster.cidade,
      uf: foster.estado,
    },
    catalog: {
      animals: animals.map((animal) => ({
        id: animal.id,
        nome: animal.nome,
        porte: animal.porte,
        sexo: animal.sexo,
        idadeEstimada: animal.idadeEstimada,
        castrado: animal.castrado,
        status: animal.status,
        fotoPrincipal: animal.fotos[0]?.urlFoto ?? null,
        especie: animal.especie?.nome ?? null,
        raca: animal.raca?.nome ?? null,
        cidade: foster.cidade,
        responsavel: publicName,
        responsavelId: foster.id,
        responsavelTipo: "ACOLHEDOR" as const,
        tags: getAnimalTags(animal),
      })),
      filterOptions: { especies, racas },
      pagination: {
        page: filters.page,
        perPage: SHOWCASE_PAGE_SIZE,
        total,
        totalPages: Math.max(1, Math.ceil(total / SHOWCASE_PAGE_SIZE)),
      },
    },
  };
}

const adopterPublicSelect = {
  id: true,
  nomeCompleto: true,
  cidade: true,
  estado: true,
  triagemConcluida: true,
  usuario: { select: { ativo: true } },
} satisfies Prisma.AdotanteSelect;

const adopterRestrictedSelect = {
  ...adopterPublicSelect,
  endereco: true,
  cep: true,
  motivoAdocao: true,
  tipoAnimalDesejado: true,
  podeArcarCustosVet: true,
  adocaoParaPresente: true,
  adocaoParaPresenteDetalhe: true,
  tipoMoradia: true,
  moradiaPropria: true,
  numAdultosCasa: true,
  temCriancas: true,
  criancasFaixaEtaria: true,
  todosConordamAdocao: true,
  condominioPermiteAnimal: true,
  janelasTeladas: true,
  acessoRua: true,
  murosSeguros: true,
  horasSozinho: true,
  responsavelViagem: true,
  planoEmGravidez: true,
  alergicosNaCasa: true,
  alergicosNaCasaDetalhe: true,
  planoMudanca: true,
  historicoDevolucao: true,
  historicoPercaDescuido: true,
  cienteLongevidade: true,
  permiteVisitaProtetor: true,
  ciendeNaoRepassar: true,
  teveAnimaisAntes: true,
  animaisAnterioresDescricao: true,
  temOutrosAnimais: true,
  outrosAnimaisDescricao: true,
} satisfies Prisma.AdotanteSelect;

async function canReadRestrictedAdopter(targetId: string, session: Session | null) {
  if (!session?.user?.id) return false;
  const viewer = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      ativo: true,
      tipoPerfil: true,
      adotante: { select: { id: true } },
      organizacao: { select: { id: true } },
      acolhedor: { select: { id: true } },
    },
  });
  if (!viewer?.ativo) return false;
  if (viewer.tipoPerfil === TipoPerfil.ADMIN) return true;
  if (viewer.tipoPerfil === TipoPerfil.ADOTANTE) return viewer.adotante?.id === targetId;

  const ownership =
    viewer.tipoPerfil === TipoPerfil.ORGANIZACAO && viewer.organizacao
      ? { organizacaoId: viewer.organizacao.id }
      : viewer.tipoPerfil === TipoPerfil.ACOLHEDOR && viewer.acolhedor
        ? { acolhedorId: viewer.acolhedor.id }
        : null;
  if (!ownership) return false;

  return Boolean(
    await prisma.solicitacaoAdocao.findFirst({
      where: { adotanteId: targetId, animal: ownership },
      select: { id: true },
    }),
  );
}

export async function getAdopterProfile(
  targetId: string,
  session: Session | null,
): Promise<AdopterProfileDTO | null> {
  const restricted = await canReadRestrictedAdopter(targetId, session);
  if (!restricted) {
    const adopter = await prisma.adotante.findUnique({
      where: { id: targetId },
      select: adopterPublicSelect,
    });
    if (!adopter?.usuario.ativo) return null;
    return {
      access: "PUBLIC",
      id: adopter.id,
      nome: adopter.nomeCompleto,
      municipio: adopter.cidade,
      uf: adopter.estado,
      triagemConcluida: adopter.triagemConcluida,
    };
  }

  const adopter = await prisma.adotante.findUnique({
    where: { id: targetId },
    select: adopterRestrictedSelect,
  });
  if (!adopter?.usuario.ativo) return null;

  const base = {
    id: adopter.id,
    nome: adopter.nomeCompleto,
    municipio: adopter.cidade,
    uf: adopter.estado,
    triagemConcluida: adopter.triagemConcluida,
  };

  const {
    id: _id, nomeCompleto: _nome, cidade, estado, endereco, cep,
    triagemConcluida: _concluida, usuario: _usuario,
    todosConordamAdocao, ciendeNaoRepassar, ...triagem
  } = adopter;
  return {
    access: "RESTRICTED",
    ...base,
    enderecoAnalise: { endereco, cep, cidade, estado },
    triagem: {
      ...triagem,
      todosConcordamAdocao: todosConordamAdocao,
      cienteNaoRepassar: ciendeNaoRepassar,
    },
  };
}

export async function searchPublicOrganizations(term: string) {
  const normalized = normalizarNomeMunicipio(term);
  const organizations = await prisma.organizacao.findMany({
    where: {
      usuario: { ativo: true },
      razaoSocialNormalizada: { contains: normalized },
    },
    orderBy: { razaoSocial: "asc" },
    take: 10,
    select: { id: true, razaoSocial: true, cidade: true, estado: true },
  });
  return organizations.map((organization) => ({
    id: organization.id,
    nome: organization.razaoSocial,
    municipio: organization.cidade,
    uf: organization.estado,
  }));
}
