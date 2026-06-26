"use server";

import { StatusAnimal, StatusSolicitacao } from "@prisma/client";
import type { Session } from "next-auth";
import type { ZodError } from "zod";

import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adoptionRequestSchema } from "@/lib/schemas/solicitacao";
import {
  requestDecisionSchema,
  type RequestDecisionInput,
} from "@/lib/schemas/solicitacao-decisao";

type ResponsibleRole = "ORGANIZACAO" | "ACOLHEDOR";

type ResponsibleSession = Session & {
  user: Session["user"] & {
    tipoPerfil: ResponsibleRole;
  };
};

type OwnedAnimal = {
  organizacaoId: string | null;
  acolhedorId: string | null;
};

function firstValidationError(error: ZodError): string {
  return error.issues[0]?.message ?? "Dados invalidos.";
}

function isResponsibleRole(role: Session["user"]["tipoPerfil"]): role is ResponsibleRole {
  return role === "ORGANIZACAO" || role === "ACOLHEDOR";
}

async function requireResponsibleSession(): Promise<
  { session: ResponsibleSession } | { error: string }
> {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return { error: "NÃ£o autenticado" };
  }

  if (!session.user.ativo) {
    return { error: "Conta desativada" };
  }

  if (!isResponsibleRole(session.user.tipoPerfil)) {
    return { error: "Apenas organizaÃ§Ãµes ou acolhedores podem decidir solicitaÃ§Ãµes" };
  }

  return { session: session as ResponsibleSession };
}

function ownsAnimal(session: ResponsibleSession, animal: OwnedAnimal): boolean {
  return (
    (Boolean(session.user.organizacaoId) &&
      animal.organizacaoId === session.user.organizacaoId) ||
    (Boolean(session.user.acolhedorId) && animal.acolhedorId === session.user.acolhedorId)
  );
}

export async function createAdoptionRequest(
  animalId: string,
): Promise<{ success?: boolean; error?: string }> {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return { error: "Não autenticado" };
  }

  if (!session.user.ativo) {
    return { error: "Conta desativada" };
  }

  if (session.user.tipoPerfil !== "ADOTANTE") {
    return { error: "Apenas adotantes podem solicitar adoção" };
  }

  const parsed = adoptionRequestSchema.safeParse({ animalId });

  if (!parsed.success) {
    return { error: "Identificador do animal inválido." };
  }

  if (!session.user.adotanteId) {
    return { error: "Perfil de adotante não encontrado." };
  }

  const validatedAnimalId = parsed.data.animalId;
  const adotanteId = session.user.adotanteId;

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
): Promise<{ success?: boolean; error?: string }> {
  const sessionResult = await requireResponsibleSession();

  if ("error" in sessionResult) {
    return { error: sessionResult.error };
  }

  const parsed = requestDecisionSchema.safeParse(data);

  if (!parsed.success) {
    return { error: firstValidationError(parsed.error) };
  }

  const solicitacao = await prisma.solicitacaoAdocao.findUnique({
    where: { id: solicitacaoId },
    select: {
      id: true,
      animalId: true,
      animal: {
        select: {
          id: true,
          organizacaoId: true,
          acolhedorId: true,
        },
      },
    },
  });

  if (!solicitacao) {
    return { error: "SolicitaÃ§Ã£o nÃ£o encontrada" };
  }

  if (!ownsAnimal(sessionResult.session, solicitacao.animal)) {
    return { error: "Acesso negado" };
  }

  if (parsed.data.decision === "APROVADA") {
    await prisma.$transaction(async (tx) => {
      await tx.solicitacaoAdocao.update({
        where: { id: solicitacaoId },
        data: {
          status: StatusSolicitacao.APROVADA,
          observacoes: parsed.data.observacoes,
        },
      });

      await tx.animal.update({
        where: { id: solicitacao.animalId },
        data: { status: StatusAnimal.EM_PROCESSO_ADOCAO },
      });

      await tx.solicitacaoAdocao.updateMany({
        where: {
          animalId: solicitacao.animalId,
          status: StatusSolicitacao.EM_ANALISE,
          id: { not: solicitacaoId },
        },
        data: { status: StatusSolicitacao.RECUSADA },
      });
    });

    return { success: true };
  }

  await prisma.$transaction(async (tx) => {
    await tx.solicitacaoAdocao.update({
      where: { id: solicitacaoId },
      data: {
        status: StatusSolicitacao.RECUSADA,
        observacoes: parsed.data.observacoes,
      },
    });
  });

  return { success: true };
}

export async function completeAdoption(
  solicitacaoId: string,
): Promise<{ success?: boolean; error?: string }> {
  void solicitacaoId;
  throw new Error("[STUB] T085 - pending implementation");
}
