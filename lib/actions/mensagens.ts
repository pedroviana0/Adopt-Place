"use server";

import { StatusConversaAdocao } from "@prisma/client";

import { getServerSession } from "@/lib/auth";
import { isActiveSession } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { mensagemSchema, type MensagemInput } from "@/lib/schemas/mensagem";

type ActionResult = { success?: boolean; error?: string };

async function participantSession() {
  const session = await getServerSession();
  if (!session?.user?.id) return { error: "Nao autenticado" } as const;
  if (!isActiveSession(session)) return { error: "Conta desativada" } as const;
  if (!["ADOTANTE", "ORGANIZACAO", "ACOLHEDOR"].includes(session.user.tipoPerfil)) {
    return { error: "Acesso negado" } as const;
  }
  return { session } as const;
}

export async function sendMensagem(
  conversationId: string,
  input: MensagemInput,
): Promise<ActionResult> {
  const parsed = mensagemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Mensagem invalida" };
  }

  const sessionResult = await participantSession();
  if ("error" in sessionResult) return { error: sessionResult.error };

  const participant = await prisma.conversaParticipante.findUnique({
    where: {
      conversaId_usuarioId: {
        conversaId: conversationId,
        usuarioId: sessionResult.session.user.id,
      },
    },
    select: { conversa: { select: { status: true } } },
  });

  if (!participant) return { error: "Acesso negado" };
  if (participant.conversa.status === StatusConversaAdocao.ARQUIVADA) {
    return { error: "Conversa arquivada" };
  }

  await prisma.mensagemAdocao.create({
    data: {
      conversaId: conversationId,
      autorUsuarioId: sessionResult.session.user.id,
      texto: parsed.data.texto,
    },
  });
  return { success: true };
}

export async function markConversationRead(
  conversationId: string,
): Promise<ActionResult> {
  const sessionResult = await participantSession();
  if ("error" in sessionResult) return { error: sessionResult.error };

  const key = {
    conversaId: conversationId,
    usuarioId: sessionResult.session.user.id,
  };
  const participant = await prisma.conversaParticipante.findUnique({
    where: { conversaId_usuarioId: key },
    select: { id: true },
  });
  if (!participant) return { error: "Acesso negado" };

  await prisma.conversaParticipante.update({
    where: { conversaId_usuarioId: key },
    data: { ultimaLeituraEm: new Date() },
  });
  return { success: true };
}
