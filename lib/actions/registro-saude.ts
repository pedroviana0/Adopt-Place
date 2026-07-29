"use server";

import type { ZodError } from "zod";
import {
  Prisma,
  ResultadoTeste,
  StatusCuidadoPlanejado,
  TipoCuidadoPlanejado,
  TipoRegistroSaude,
} from "@prisma/client";

import {
  getResponsibleContext,
  type ResponsibleContext,
} from "@/lib/api/responsible-context";
import { prisma } from "@/lib/prisma";
import {
  registroSaudeSchema,
  type RegistroSaudeInput,
} from "@/lib/schemas/registro-saude";

type ActionResult = {
  success?: boolean;
  id?: string;
  error?: string;
  code?: string;
};

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
  providedContext?: ResponsibleContext,
): Promise<ActionResult> {
  const sessionResult = await resolveResponsibleContext(providedContext);

  if ("error" in sessionResult) {
    return sessionResult;
  }

  const parsed = registroSaudeSchema.safeParse(data);

  if (!parsed.success) {
    return { error: firstValidationError(parsed.error) };
  }

  const animal = await prisma.animal.findFirst({
    where: { id: animalId, ...ownershipFilter(sessionResult.context) },
    select: { id: true },
  });

  if (!animal) {
    return { error: "Animal nao encontrado" };
  }

  let recordId: string | undefined;
  await prisma.$transaction(async (tx) => {
    const record = await tx.registroSaude.create({
      data: {
        animalId,
        ...mapToPrisma(parsed.data),
      },
      select: { id: true },
    });
    recordId = record.id;
    await syncPlannedCare(tx, record.id, animalId, parsed.data);
  });

  return { success: true, id: recordId };
}

export async function updateRegistroSaude(
  id: string,
  data: RegistroSaudeInput,
  providedContext?: ResponsibleContext,
): Promise<ActionResult> {
  const sessionResult = await resolveResponsibleContext(providedContext);

  if ("error" in sessionResult) {
    return sessionResult;
  }

  const parsed = registroSaudeSchema.safeParse(data);

  if (!parsed.success) {
    return { error: firstValidationError(parsed.error) };
  }

  const registro = await prisma.registroSaude.findFirst({
    where: {
      id,
      animal: ownershipFilter(sessionResult.context),
    },
    select: {
      animalId: true,
    },
  });

  if (!registro) {
    return { error: "Registro de saude nao encontrado" };
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

export async function deleteRegistroSaude(
  id: string,
  providedContext?: ResponsibleContext,
): Promise<ActionResult> {
  const sessionResult = await resolveResponsibleContext(providedContext);

  if ("error" in sessionResult) {
    return sessionResult;
  }

  const registro = await prisma.registroSaude.findFirst({
    where: {
      id,
      animal: ownershipFilter(sessionResult.context),
    },
    select: { id: true },
  });

  if (!registro) {
    return { error: "Registro de saude nao encontrado" };
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
