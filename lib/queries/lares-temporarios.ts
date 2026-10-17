import { Prisma, SituacaoLT } from "@prisma/client";

import { prisma } from "@/lib/prisma";

// Toda consulta de lar temporario e escopada pela organizacao dona (spec 009,
// RF-026): dado pessoal de terceiro nunca cruza para outra ONG.

const fosterHomeSelect = {
  id: true,
  nomeTutor: true,
  telefone: true,
  endereco: true,
  cidade: true,
  observacoes: true,
  criadoEm: true,
  atualizadoEm: true,
  _count: { select: { animais: true } },
} satisfies Prisma.LarTemporarioSelect;

const linkedAnimalSelect = {
  id: true,
  nome: true,
  status: true,
  fotos: {
    orderBy: [{ principal: "desc" as const }, { ordem: "asc" as const }],
    take: 1,
    select: { urlFoto: true },
  },
} satisfies Prisma.AnimalSelect;

type FosterHomeRecord = Prisma.LarTemporarioGetPayload<{
  select: typeof fosterHomeSelect;
}>;
type LinkedAnimalRecord = Prisma.AnimalGetPayload<{
  select: typeof linkedAnimalSelect;
}>;

function toFosterHomeDTO(record: FosterHomeRecord) {
  return {
    id: record.id,
    nomeTutor: record.nomeTutor,
    telefone: record.telefone,
    endereco: record.endereco,
    cidade: record.cidade,
    observacoes: record.observacoes,
    totalAnimais: record._count.animais,
    criadoEm: record.criadoEm.toISOString(),
    atualizadoEm: record.atualizadoEm.toISOString(),
  };
}

function toLinkedAnimalDTO(animal: LinkedAnimalRecord) {
  return {
    id: animal.id,
    nome: animal.nome,
    status: animal.status,
    fotoPrincipal: animal.fotos[0] ?? null,
  };
}

export async function getFosterHomes(organizacaoId: string) {
  const records = await prisma.larTemporario.findMany({
    where: { organizacaoId },
    orderBy: { nomeTutor: "asc" },
    select: fosterHomeSelect,
  });
  return records.map(toFosterHomeDTO);
}

export async function getFosterHomeDetail(id: string, organizacaoId: string) {
  const record = await prisma.larTemporario.findFirst({
    where: { id, organizacaoId },
    select: {
      ...fosterHomeSelect,
      animais: { orderBy: { nome: "asc" }, select: linkedAnimalSelect },
    },
  });
  if (!record) return null;

  return {
    ...toFosterHomeDTO(record),
    animais: record.animais.map(toLinkedAnimalDTO),
  };
}

// Candidatos ao vinculo pela aba (RF-024): da propria ONG, em LT e sem LT
// registrado.
export async function getLinkableAnimals(organizacaoId: string) {
  const animals = await prisma.animal.findMany({
    where: {
      organizacaoId,
      situacaoLT: SituacaoLT.EM_LT,
      larTemporarioId: null,
    },
    orderBy: { nome: "asc" },
    select: linkedAnimalSelect,
  });
  return animals.map(toLinkedAnimalDTO);
}

export type FosterHomeDTO = ReturnType<typeof toFosterHomeDTO>;
export type LinkedAnimalDTO = ReturnType<typeof toLinkedAnimalDTO>;
