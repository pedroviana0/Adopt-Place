"use server";

import type { ZodError } from "zod";
import {
  Prisma,
  ResultadoTeste,
  StatusCuidadoPlanejado,
  TipoCuidadoPlanejado,
  TipoRegistroSaude,
} from "@prisma/client";

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

function mapToPrisma(data: RegistroSaudeInput) {
  const common = {
    dataRegistro: data.dataAplicacao,
    responsavelRegistro: "Sistema",
    titulo: data.titulo ?? null,
    observacoes: data.observacoes ?? null,
    profissionalClinica: data.profissionalClinica ?? null,
    nomeVacina: null,
    ehVacinaCustomizada: null,
    tipoMedicamento: null,
    frequencia: null,
    nomeDoenca: null,
    ehDoencaCustomizada: null,
    resultado: null,
    procedimento: null,
    medicamentoTratamento: null,
  };

  switch (data.tipoRegistro) {
    case "VACINA":
      return {
        ...common,
        tipo: TipoRegistroSaude.VACINA,
        dataProxima: data.dataProximaDose ?? null,
        nomeVacina: data.nomeCustom ?? null,
        ehVacinaCustomizada: data.nomeCustom !== undefined,
      };
    case "CONTROLE_PARASITAS":
      return {
        ...common,
        tipo: TipoRegistroSaude.CONTROLE_PARASITAS,
        dataProxima: data.dataProxima ?? null,
        tipoMedicamento: data.tipoMedicacao,
        frequencia: data.frequencia,
      };
    case "TESTE_DOENCA":
      return {
        ...common,
        tipo: TipoRegistroSaude.TESTE_DOENCA,
        dataProxima: data.dataProxima ?? null,
        nomeDoenca: data.nomeCustom ?? null,
        ehDoencaCustomizada: data.nomeCustom !== undefined,
        resultado: data.resultado === "POSITIVO" ? ResultadoTeste.POSITIVO : ResultadoTeste.NEGATIVO,
      };
    case "MEDICAMENTO_TRATAMENTO":
      return {
        ...common,
        tipo: TipoRegistroSaude.MEDICAMENTO_TRATAMENTO,
        dataProxima: data.dataProxima ?? null,
        medicamentoTratamento: data.medicamentoTratamento,
      };
    case "PROCEDIMENTO":
      return {
        ...common,
        tipo: TipoRegistroSaude.PROCEDIMENTO,
        dataProxima: data.dataProxima ?? null,
        procedimento: data.procedimento,
      };
  }
}

function plannedCareTitle(data: RegistroSaudeInput): string {
  if (data.titulo) return data.titulo;

  switch (data.tipoRegistro) {
    case "VACINA":
      return data.nomeCustom ?? "Proxima vacina";
    case "CONTROLE_PARASITAS":
      return data.tipoMedicacao;
    case "TESTE_DOENCA":
      return data.nomeCustom ?? "Proximo teste de doenca";
    case "MEDICAMENTO_TRATAMENTO":
      return data.medicamentoTratamento;
    case "PROCEDIMENTO":
      return data.procedimento;
  }
}

async function syncPlannedCare(
  tx: Prisma.TransactionClient,
  recordId: string,
  animalId: string,
  data: RegistroSaudeInput,
): Promise<void> {
  const mapped = mapToPrisma(data);

  if (!mapped.dataProxima) {
    await tx.cuidadoPlanejado.deleteMany({
      where: {
        origemRegistroSaudeId: recordId,
        status: StatusCuidadoPlanejado.PENDENTE,
      },
    });
    return;
  }

  const planned = {
    animalId,
    tipo: data.tipoRegistro as TipoCuidadoPlanejado,
    status: StatusCuidadoPlanejado.PENDENTE,
    dataHoraPlanejada: mapped.dataProxima,
    titulo: plannedCareTitle(data),
    observacoes: data.observacoes ?? null,
    localProfissional: data.profissionalClinica ?? null,
    canceladoEm: null,
    concluidoEm: null,
  };

  await tx.cuidadoPlanejado.upsert({
    where: { origemRegistroSaudeId: recordId },
    create: { ...planned, origemRegistroSaudeId: recordId },
    update: planned,
  });
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

  await prisma.$transaction(async (tx) => {
    const record = await tx.registroSaude.create({
      data: {
        animalId,
        ...mapToPrisma(parsed.data),
      },
      select: { id: true },
    });
    await syncPlannedCare(tx, record.id, animalId, parsed.data);
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
      animalId: true,
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

  await prisma.$transaction(async (tx) => {
    await tx.registroSaude.update({
      where: { id },
      data: mapToPrisma(parsed.data),
    });
    await syncPlannedCare(tx, id, registro.animalId, parsed.data);
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

  await prisma.$transaction(async (tx) => {
    await tx.cuidadoPlanejado.deleteMany({
      where: {
        origemRegistroSaudeId: id,
        status: StatusCuidadoPlanejado.PENDENTE,
      },
    });
    await tx.registroSaude.delete({ where: { id } });
  });

  return { success: true };
}
