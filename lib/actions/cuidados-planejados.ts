"use server";

import {
  Prisma,
  ResultadoTeste,
  StatusCuidadoPlanejado,
  TipoCuidadoPlanejado,
  TipoRegistroSaude,
} from "@prisma/client";
import type { ZodError } from "zod";

import { getServerSession } from "@/lib/auth";
import { type AppSession, isActiveSession, isResponsibleUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  cancelarCuidadoSchema,
  consultaPlanejadaSchema,
  reagendarCuidadoSchema,
  type ConsultaPlanejadaInput,
  type ConcluirCuidadoInput,
  type ReagendarCuidadoInput,
} from "@/lib/schemas/cuidado-planejado";
import { registroSaudeSchema } from "@/lib/schemas/registro-saude";

type ActionResult = { success?: boolean; error?: string };

function firstValidationError(error: ZodError): string {
  return error.issues[0]?.message ?? "Dados invalidos.";
}

async function responsibleSession(): Promise<
  { session: AppSession } | { error: string }
> {
  const session = await getServerSession();

  if (!session?.user?.id) return { error: "Nao autenticado" };
  if (!isActiveSession(session)) return { error: "Conta desativada" };
  if (!isResponsibleUser(session)) {
    return { error: "Apenas responsaveis podem gerenciar a agenda" };
  }

  return { session };
}

function ownsAnimal(
  session: AppSession,
  animal: { organizacaoId: string | null; acolhedorId: string | null },
): boolean {
  return Boolean(
    (session.user.organizacaoId &&
      animal.organizacaoId === session.user.organizacaoId) ||
      (session.user.acolhedorId &&
        animal.acolhedorId === session.user.acolhedorId),
  );
}

async function authorizedPendingCare(
  session: AppSession,
  careId: string,
) {
  const care = await prisma.cuidadoPlanejado.findUnique({
    where: { id: careId },
    select: {
      id: true,
      status: true,
      animal: { select: { organizacaoId: true, acolhedorId: true } },
    },
  });

  if (!care) return { error: "Cuidado nao encontrado" } as const;
  if (!ownsAnimal(session, care.animal)) return { error: "Acesso negado" } as const;
  if (care.status !== StatusCuidadoPlanejado.PENDENTE) {
    return { error: "Cuidado ja concluido ou cancelado" } as const;
  }

  return { care } as const;
}

export async function createConsultaPlanejada(
  input: ConsultaPlanejadaInput,
): Promise<ActionResult> {
  const sessionResult = await responsibleSession();
  if ("error" in sessionResult) return { error: sessionResult.error };

  const parsed = consultaPlanejadaSchema.safeParse(input);
  if (!parsed.success) return { error: firstValidationError(parsed.error) };

  const animal = await prisma.animal.findUnique({
    where: { id: parsed.data.animalId },
    select: { organizacaoId: true, acolhedorId: true },
  });

  if (!animal) return { error: "Animal nao encontrado" };
  if (!ownsAnimal(sessionResult.session, animal)) return { error: "Acesso negado" };

  await prisma.cuidadoPlanejado.create({
    data: {
      animalId: parsed.data.animalId,
      tipo: TipoCuidadoPlanejado.CONSULTA,
      status: StatusCuidadoPlanejado.PENDENTE,
      dataHoraPlanejada: parsed.data.dataHoraPlanejada,
      titulo: parsed.data.titulo,
      observacoes: parsed.data.observacoes ?? null,
      localProfissional: parsed.data.localProfissional ?? null,
    },
  });

  return { success: true };
}

export async function rescheduleCuidadoPlanejado(
  careId: string,
  input: ReagendarCuidadoInput,
): Promise<ActionResult> {
  const sessionResult = await responsibleSession();
  if ("error" in sessionResult) return { error: sessionResult.error };

  const parsed = reagendarCuidadoSchema.safeParse(input);
  if (!parsed.success) return { error: firstValidationError(parsed.error) };

  const authorized = await authorizedPendingCare(sessionResult.session, careId);
  if ("error" in authorized) return { error: authorized.error };

  const updated = await prisma.cuidadoPlanejado.updateMany({
    where: { id: careId, status: StatusCuidadoPlanejado.PENDENTE },
    data: { dataHoraPlanejada: parsed.data.dataHoraPlanejada },
  });

  return updated.count === 1
    ? { success: true }
    : { error: "Cuidado ja concluido ou cancelado" };
}

export async function cancelCuidadoPlanejado(
  careId: string,
  input: { confirmado: true },
): Promise<ActionResult> {
  const sessionResult = await responsibleSession();
  if ("error" in sessionResult) return { error: sessionResult.error };

  const parsed = cancelarCuidadoSchema.safeParse(input);
  if (!parsed.success) return { error: firstValidationError(parsed.error) };

  const authorized = await authorizedPendingCare(sessionResult.session, careId);
  if ("error" in authorized) return { error: authorized.error };

  const updated = await prisma.cuidadoPlanejado.updateMany({
    where: { id: careId, status: StatusCuidadoPlanejado.PENDENTE },
    data: {
      status: StatusCuidadoPlanejado.CANCELADO,
      canceladoEm: new Date(),
    },
  });

  return updated.count === 1
    ? { success: true }
    : { error: "Cuidado ja concluido ou cancelado" };
}

function completedHealthData(data: ConcluirCuidadoInput) {
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
        resultado:
          data.resultado === "POSITIVO"
            ? ResultadoTeste.POSITIVO
            : ResultadoTeste.NEGATIVO,
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

function nextCareTitle(data: ConcluirCuidadoInput): string {
  if (data.titulo) return data.titulo;
  if (data.tipoRegistro === "VACINA") return data.nomeCustom ?? "Proxima vacina";
  if (data.tipoRegistro === "CONTROLE_PARASITAS") return data.tipoMedicacao;
  if (data.tipoRegistro === "TESTE_DOENCA") {
    return data.nomeCustom ?? "Proximo teste de doenca";
  }
  if (data.tipoRegistro === "MEDICAMENTO_TRATAMENTO") {
    return data.medicamentoTratamento;
  }
  return data.procedimento;
}

async function createNextCare(
  tx: Prisma.TransactionClient,
  recordId: string,
  animalId: string,
  data: ConcluirCuidadoInput,
  nextDate: Date | null,
): Promise<void> {
  if (!nextDate) return;

  await tx.cuidadoPlanejado.upsert({
    where: { origemRegistroSaudeId: recordId },
    create: {
      animalId,
      tipo: data.tipoRegistro as TipoCuidadoPlanejado,
      status: StatusCuidadoPlanejado.PENDENTE,
      dataHoraPlanejada: nextDate,
      titulo: nextCareTitle(data),
      observacoes: data.observacoes ?? null,
      localProfissional: data.profissionalClinica ?? null,
      origemRegistroSaudeId: recordId,
    },
    update: {
      dataHoraPlanejada: nextDate,
      titulo: nextCareTitle(data),
      observacoes: data.observacoes ?? null,
      localProfissional: data.profissionalClinica ?? null,
    },
  });
}

export async function completeCuidadoPlanejado(
  careId: string,
  input?: ConcluirCuidadoInput,
): Promise<ActionResult> {
  const sessionResult = await responsibleSession();
  if ("error" in sessionResult) return { error: sessionResult.error };

  const authorized = await authorizedPendingCare(sessionResult.session, careId);
  if ("error" in authorized) return { error: authorized.error };

  const care = await prisma.cuidadoPlanejado.findUnique({
    where: { id: careId },
    select: { id: true, animalId: true, tipo: true },
  });
  if (!care) return { error: "Cuidado nao encontrado" };
  if (care.tipo === TipoCuidadoPlanejado.CONSULTA) {
    return prisma.$transaction(async (tx) => {
      const claimed = await tx.cuidadoPlanejado.updateMany({
        where: { id: careId, status: StatusCuidadoPlanejado.PENDENTE },
        data: {
          status: StatusCuidadoPlanejado.CONCLUIDO,
          concluidoEm: new Date(),
        },
      });

      return claimed.count === 1
        ? { success: true }
        : { error: "Cuidado ja concluido ou cancelado" };
    });
  }

  const parsed = registroSaudeSchema.safeParse(input);
  if (!parsed.success) return { error: firstValidationError(parsed.error) };
  if (parsed.data.tipoRegistro !== care.tipo) {
    return { error: "A categoria realizada deve corresponder ao cuidado planejado" };
  }

  return prisma.$transaction(async (tx) => {
    const claimed = await tx.cuidadoPlanejado.updateMany({
      where: { id: careId, status: StatusCuidadoPlanejado.PENDENTE },
      data: {
        status: StatusCuidadoPlanejado.CONCLUIDO,
        concluidoEm: new Date(),
      },
    });

    if (claimed.count !== 1) {
      return { error: "Cuidado ja concluido ou cancelado" };
    }

    const healthData = completedHealthData(parsed.data);
    const record = await tx.registroSaude.create({
      data: { animalId: care.animalId, ...healthData },
      select: { id: true },
    });

    await tx.cuidadoPlanejado.update({
      where: { id: careId },
      data: { registroRealizadoId: record.id },
    });
    await createNextCare(
      tx,
      record.id,
      care.animalId,
      parsed.data,
      healthData.dataProxima,
    );

    return { success: true };
  });
}
