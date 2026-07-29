"use server";

import { StatusAnimal, StatusSolicitacao } from "@prisma/client";
import type { ZodError } from "zod";

import {
  getResponsibleContext,
  type ResponsibleContext,
} from "@/lib/api/responsible-context";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adoptionRequestSchema } from "@/lib/schemas/solicitacao";
import {
  requestDecisionSchema,
  type RequestDecisionInput,
} from "@/lib/schemas/solicitacao-decisao";

type ActionResult = { success?: boolean; error?: string; code?: string };

class InvalidTransitionError extends Error {}

function firstValidationError(error: ZodError): string {
  return error.issues[0]?.message ?? "Dados invalidos.";
}

function ownershipFilter(context: ResponsibleContext) {
  return context.tipoPerfil === "ORGANIZACAO"
    ? { organizacaoId: context.responsavelId }
    : { acolhedorId: context.responsavelId };
}

async function resolveResponsibleContext(
  provided?: ResponsibleContext,
): Promise<{ context: ResponsibleContext } | { error: string; code: string }> {
  if (provided) return { context: provided };
  const current = await getResponsibleContext();
  return "error" in current
    ? { error: current.error.message, code: current.error.code }
    : current;
}

export async function createAdoptionRequest(
  animalId: string,
): Promise<ActionResult> {
  const session = await getServerSession();

  if (!session?.user?.id) return { error: "Não autenticado" };
  if (!session.user.ativo) return { error: "Conta desativada" };
  if (session.user.tipoPerfil !== "ADOTANTE") {
    return { error: "Apenas adotantes podem solicitar adoção" };
  }

  const parsed = adoptionRequestSchema.safeParse({ animalId });
  if (!parsed.success) return { error: "Identificador do animal inválido." };
  if (!session.user.adotanteId) {
    return { error: "Perfil de adotante não encontrado." };
  }

  const adotanteId = session.user.adotanteId;
  const validatedAnimalId = parsed.data.animalId;
  const adotante = await prisma.adotante.findUnique({
    where: { id: adotanteId },
    select: { triagemConcluida: true },
  });
  if (!adotante?.triagemConcluida) {
    return {
      error: "Conclua a triagem em /dashboard/triagem antes de solicitar adoção",
    };
  }

  const animal = await prisma.animal.findUnique({
    where: { id: validatedAnimalId },
    select: { status: true },
  });
  if (animal?.status !== StatusAnimal.DISPONIVEL) {
    return { error: "Animal indisponível para adoção" };
  }

  const existingRequest = await prisma.solicitacaoAdocao.findFirst({
    where: {
      adotanteId,
      animalId: validatedAnimalId,
      status: StatusSolicitacao.EM_ANALISE,
    },
    select: { id: true },
  });
  if (existingRequest) {
    return { error: "Você já tem uma solicitação ativa para este animal" };
  }

  await prisma.solicitacaoAdocao.create({
    data: {
      adotanteId,
      animalId: validatedAnimalId,
      status: StatusSolicitacao.EM_ANALISE,
    },
  });
  return { success: true };
}

export async function decideAdoptionRequest(
  solicitacaoId: string,
  data: RequestDecisionInput,
  providedContext?: ResponsibleContext,
): Promise<ActionResult> {
  const current = await resolveResponsibleContext(providedContext);
  if ("error" in current) return current;

  const parsed = requestDecisionSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: firstValidationError(parsed.error),
      code: "VALIDATION_ERROR",
    };
  }

  const request = await prisma.solicitacaoAdocao.findFirst({
    where: {
      id: solicitacaoId,
      animal: ownershipFilter(current.context),
    },
    select: {
      id: true,
      animalId: true,
      status: true,
      adotante: { select: { usuarioId: true } },
      animal: { select: { id: true } },
    },
  });

  if (!request) {
    return { error: "Solicitacao nao encontrada", code: "NOT_FOUND" };
  }
  if (request.status !== StatusSolicitacao.EM_ANALISE) {
    return {
      error: "Apenas solicitacoes em analise podem receber uma decisao",
      code: "INVALID_TRANSITION",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const changed = await tx.solicitacaoAdocao.updateMany({
        where: {
          id: solicitacaoId,
          status: StatusSolicitacao.EM_ANALISE,
        },
        data: {
          status: parsed.data.decision,
          observacoes: parsed.data.observacoes,
        },
      });
      if (changed.count !== 1) throw new InvalidTransitionError();

      if (parsed.data.decision === StatusSolicitacao.RECUSADA) return;

      const animalChanged = await tx.animal.updateMany({
        where: {
          id: request.animalId,
          status: StatusAnimal.DISPONIVEL,
        },
        data: { status: StatusAnimal.EM_PROCESSO_ADOCAO },
      });
      if (animalChanged.count !== 1) throw new InvalidTransitionError();

      await tx.solicitacaoAdocao.updateMany({
        where: {
          animalId: request.animalId,
          status: StatusSolicitacao.EM_ANALISE,
          id: { not: solicitacaoId },
        },
        data: { status: StatusSolicitacao.RECUSADA },
      });

      const conversation = await tx.conversaAdocao.upsert({
        where: { solicitacaoId },
        create: { solicitacaoId, status: "ATIVA" },
        update: {},
        select: { id: true },
      });
      await tx.conversaParticipante.createMany({
        data: [
          {
            conversaId: conversation.id,
            usuarioId: request.adotante.usuarioId,
          },
          {
            conversaId: conversation.id,
            usuarioId: current.context.userId,
          },
        ],
        skipDuplicates: true,
      });
    });
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      return {
        error: "A solicitacao ou o animal mudou durante a decisao",
        code: "INVALID_TRANSITION",
      };
    }
    throw error;
  }

  return { success: true };
}

export async function completeAdoption(
  solicitacaoId: string,
  providedContext?: ResponsibleContext,
): Promise<ActionResult> {
  const current = await resolveResponsibleContext(providedContext);
  if ("error" in current) return current;

  const request = await prisma.solicitacaoAdocao.findFirst({
    where: {
      id: solicitacaoId,
      animal: ownershipFilter(current.context),
    },
    select: { id: true, animalId: true, status: true },
  });
  if (!request) {
    return { error: "Solicitacao nao encontrada", code: "NOT_FOUND" };
  }
  if (request.status !== StatusSolicitacao.APROVADA) {
    return {
      error: "Apenas solicitacoes aprovadas podem ser concluidas",
      code: "INVALID_TRANSITION",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const changed = await tx.solicitacaoAdocao.updateMany({
        where: {
          id: solicitacaoId,
          status: StatusSolicitacao.APROVADA,
        },
        data: { status: StatusSolicitacao.CONCLUIDA },
      });
      if (changed.count !== 1) throw new InvalidTransitionError();

      const animalChanged = await tx.animal.updateMany({
        where: {
          id: request.animalId,
          status: StatusAnimal.EM_PROCESSO_ADOCAO,
        },
        data: { status: StatusAnimal.ADOTADO },
      });
      if (animalChanged.count !== 1) throw new InvalidTransitionError();

      await tx.conversaAdocao.updateMany({
        where: { solicitacaoId },
        data: { status: "ARQUIVADA", arquivadaEm: new Date() },
      });
    });
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      return {
        error: "A solicitacao ou o animal mudou durante a conclusao",
        code: "INVALID_TRANSITION",
      };
    }
    throw error;
  }

  return { success: true };
}
