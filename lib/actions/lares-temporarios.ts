import { SituacaoLT } from "@prisma/client";

import type { ResponsibleContext } from "@/lib/api/responsible-context";
import { prisma } from "@/lib/prisma";
import type {
  LarTemporarioCreateInput,
  LarTemporarioUpdateInput,
} from "@/lib/schemas/lar-temporario";

// Chamadas so pelas rotas /api/lares-temporarios, que ja exigem organizacao
// ativa e validaram o corpo. Toda escrita filtra pela organizacao da sessao:
// LT de outra ONG se comporta como inexistente (spec 009, RF-026).

type ActionResult = { success?: boolean; id?: string; error?: string; code?: string };

const notFound = { error: "Lar temporario nao encontrado", code: "NOT_FOUND" };

function fosterHomeData(input: LarTemporarioUpdateInput) {
  return {
    nomeTutor: input.nomeTutor,
    telefone: input.telefone,
    endereco: input.endereco,
    cidade: input.cidade,
    observacoes: input.observacoes ?? null,
  };
}

export async function createFosterHome(
  input: LarTemporarioCreateInput,
  context: ResponsibleContext,
): Promise<ActionResult> {
  // autorizacaoTutor foi exigido na validacao e nao e persistido (C3).
  const { autorizacaoTutor: _autorizacao, ...fields } = input;
  const created = await prisma.larTemporario.create({
    data: { ...fosterHomeData(fields), organizacaoId: context.responsavelId },
    select: { id: true },
  });
  return { id: created.id };
}

export async function updateFosterHome(
  id: string,
  input: LarTemporarioUpdateInput,
  context: ResponsibleContext,
): Promise<ActionResult> {
  const updated = await prisma.larTemporario.updateMany({
    where: { id, organizacaoId: context.responsavelId },
    data: fosterHomeData(input),
  });
  return updated.count === 1 ? { success: true } : notFound;
}

// Exclusao fisica (C4). A FK ON DELETE SET NULL desvincula os animais, que
// continuam EM_LT sem registro.
export async function deleteFosterHome(
  id: string,
  context: ResponsibleContext,
): Promise<ActionResult> {
  const deleted = await prisma.larTemporario.deleteMany({
    where: { id, organizacaoId: context.responsavelId },
  });
  return deleted.count === 1 ? { success: true } : notFound;
}

export async function linkAnimalToFosterHome(
  larTemporarioId: string,
  animalId: string,
  context: ResponsibleContext,
): Promise<ActionResult> {
  const fosterHome = await prisma.larTemporario.findFirst({
    where: { id: larTemporarioId, organizacaoId: context.responsavelId },
    select: { id: true },
  });
  if (!fosterHome) return notFound;

  // A condicao no where torna o vinculo atomico: so EM_LT sem LT da propria ONG.
  const linked = await prisma.animal.updateMany({
    where: {
      id: animalId,
      organizacaoId: context.responsavelId,
      situacaoLT: SituacaoLT.EM_LT,
      larTemporarioId: null,
    },
    data: { larTemporarioId },
  });
  return linked.count === 1
    ? { success: true }
    : {
        error: "O animal nao esta mais disponivel para vinculo",
        code: "INVALID_TRANSITION",
      };
}

// Desvincular mantem a situacao EM_LT: o animal fica "em LT sem registro".
export async function unlinkAnimalFromFosterHome(
  larTemporarioId: string,
  animalId: string,
  context: ResponsibleContext,
): Promise<ActionResult> {
  const unlinked = await prisma.animal.updateMany({
    where: {
      id: animalId,
      organizacaoId: context.responsavelId,
      larTemporarioId,
    },
    data: { larTemporarioId: null },
  });
  return unlinked.count === 1
    ? { success: true }
    : { error: "Animal nao vinculado a este lar temporario", code: "NOT_FOUND" };
}
