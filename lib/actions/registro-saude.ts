"use server";

import type { ZodError } from "zod";
import { TipoRegistroSaude, ResultadoTeste } from "@prisma/client";

import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  registroSaudeSchema,
  type RegistroSaudeInput,
} from "@/lib/schemas/registro-saude";

type ActionResult = { success?: boolean; error?: string };

function firstValidationError(error: ZodError): string {
  return error.issues[0]?.message ?? "Dados invalidos.";
}

type ResponsibleSession = {
  user: {
    id: string;
    tipoPerfil: "ORGANIZACAO" | "ACOLHEDOR";
    ativo: boolean;
    organizacaoId: string | null;
    acolhedorId: string | null;
  };
};

async function requireResponsibleSession(): Promise<
  { session: ResponsibleSession } | { error: string }
> {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return { error: "Nao autenticado" };
  }

  if (!session.user.ativo) {
    return { error: "Conta desativada" };
  }

  if (session.user.tipoPerfil !== "ORGANIZACAO" && session.user.tipoPerfil !== "ACOLHEDOR") {
    return { error: "Apenas organizacoes ou acolhedores podem gerenciar registros de saude" };
  }

  return { session: session as ResponsibleSession };
}

function ownsAnimal(session: ResponsibleSession, animal: { organizacaoId: string | null; acolhedorId: string | null }): boolean {
  return (
    (Boolean(session.user.organizacaoId) && animal.organizacaoId === session.user.organizacaoId) ||
    (Boolean(session.user.acolhedorId) && animal.acolhedorId === session.user.acolhedorId)
  );
}

function mapToPrisma(data: RegistroSaudeInput): {
  tipo: TipoRegistroSaude;
  dataRegistro: Date;
  dataProxima: Date | null;
  responsavelRegistro: string;
  nomeVacina: string | null;
  ehVacinaCustomizada: boolean | null;
  tipoMedicamento: string | null;
  frequencia: string | null;
  nomeDoenca: string | null;
  ehDoencaCustomizada: boolean | null;
  resultado: ResultadoTeste | null;
} {
  switch (data.tipoRegistro) {
    case "VACINA":
      return {
        tipo: TipoRegistroSaude.VACINA,
        dataRegistro: data.dataAplicacao,
        dataProxima: data.dataProximaDose ?? null,
        responsavelRegistro: "Sistema",
        nomeVacina: data.nomeCustom ?? null,
        ehVacinaCustomizada: data.nomeCustom !== undefined,
        tipoMedicamento: null,
        frequencia: null,
        nomeDoenca: null,
        ehDoencaCustomizada: null,
        resultado: null,
      };
    case "CONTROLE_PARASITAS":
      return {
        tipo: TipoRegistroSaude.CONTROLE_PARASITAS,
        dataRegistro: data.dataAplicacao,
        dataProxima: data.dataProxima ?? null,
        responsavelRegistro: "Sistema",
        nomeVacina: null,
        ehVacinaCustomizada: null,
        tipoMedicamento: data.tipoMedicacao,
        frequencia: data.frequencia,
        nomeDoenca: null,
        ehDoencaCustomizada: null,
        resultado: null,
      };
    case "TESTE_DOENCA":
      return {
        tipo: TipoRegistroSaude.TESTE_DOENCA,
        dataRegistro: data.dataAplicacao,
        dataProxima: null,
        responsavelRegistro: "Sistema",
        nomeVacina: null,
        ehVacinaCustomizada: null,
        tipoMedicamento: null,
        frequencia: null,
        nomeDoenca: data.nomeCustom ?? null,
        ehDoencaCustomizada: data.nomeCustom !== undefined,
        resultado: data.resultado === "POSITIVO" ? ResultadoTeste.POSITIVO : ResultadoTeste.NEGATIVO,
      };
  }
}

export async function createRegistroSaude(
  animalId: string,
  data: RegistroSaudeInput,
): Promise<ActionResult> {
  const sessionResult = await requireResponsibleSession();

  if ("error" in sessionResult) {
    return { error: sessionResult.error };
  }

  const parsed = registroSaudeSchema.safeParse(data);

  if (!parsed.success) {
    return { error: firstValidationError(parsed.error) };
  }

  const animal = await prisma.animal.findUnique({
    where: { id: animalId },
    select: { organizacaoId: true, acolhedorId: true },
  });

  if (!animal) {
    return { error: "Animal nao encontrado" };
  }

  if (!ownsAnimal(sessionResult.session, animal)) {
    return { error: "Acesso negado" };
  }

  await prisma.registroSaude.create({
    data: {
      animalId,
      ...mapToPrisma(parsed.data),
    },
  });

  return { success: true };
}

export async function updateRegistroSaude(
  id: string,
  data: RegistroSaudeInput,
): Promise<ActionResult> {
  const sessionResult = await requireResponsibleSession();

  if ("error" in sessionResult) {
    return { error: sessionResult.error };
  }

  const parsed = registroSaudeSchema.safeParse(data);

  if (!parsed.success) {
    return { error: firstValidationError(parsed.error) };
  }

  const registro = await prisma.registroSaude.findUnique({
    where: { id },
    select: {
      animal: {
        select: { organizacaoId: true, acolhedorId: true },
      },
    },
  });

  if (!registro?.animal) {
    return { error: "Registro de saude nao encontrado" };
  }

  if (!ownsAnimal(sessionResult.session, registro.animal)) {
    return { error: "Acesso negado" };
  }

  await prisma.registroSaude.update({
    where: { id },
    data: mapToPrisma(parsed.data),
  });

  return { success: true };
}

export async function deleteRegistroSaude(id: string): Promise<ActionResult> {
  const sessionResult = await requireResponsibleSession();

  if ("error" in sessionResult) {
    return { error: sessionResult.error };
  }

  const registro = await prisma.registroSaude.findUnique({
    where: { id },
    select: {
      animal: {
        select: { organizacaoId: true, acolhedorId: true },
      },
    },
  });

  if (!registro?.animal) {
    return { error: "Registro de saude nao encontrado" };
  }

  if (!ownsAnimal(sessionResult.session, registro.animal)) {
    return { error: "Acesso negado" };
  }

  await prisma.registroSaude.delete({
    where: { id },
  });

  return { success: true };
}
