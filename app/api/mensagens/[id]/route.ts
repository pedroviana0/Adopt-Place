import { NextRequest, NextResponse } from "next/server";

import {
  chatApiError,
  requireActiveChatParticipant,
} from "@/lib/api/chat-http";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const current = await requireActiveChatParticipant();
  if ("response" in current) return current.response;

  const { id: conversationId } = await params;
  const participant = await prisma.conversaParticipante.findUnique({
    where: {
      conversaId_usuarioId: {
        conversaId: conversationId,
        usuarioId: current.userId,
      },
    },
    select: { conversa: { select: { status: true } } },
  });
  if (!participant) {
    return chatApiError(404, "NOT_FOUND", "Conversa nao encontrada");
  }

  const afterValue = request.nextUrl.searchParams.get("after");
  const after = afterValue ? new Date(afterValue) : undefined;
  if (after && Number.isNaN(after.getTime())) {
    return chatApiError(400, "VALIDATION_ERROR", "Cursor invalido");
  }

  const messages = await prisma.mensagemAdocao.findMany({
    where: {
      conversaId: conversationId,
      ...(after ? { criadaEm: { gt: after } } : {}),
    },
    orderBy: { criadaEm: "asc" },
    take: 100,
    select: {
      id: true,
      texto: true,
      criadaEm: true,
      autorUsuarioId: true,
    },
  });

  return NextResponse.json({
    messages: messages.map((message) => ({
      id: message.id,
      text: message.texto,
      sentAt: message.criadaEm,
      authorIsMe: message.autorUsuarioId === current.userId,
    })),
    status: participant.conversa.status,
  });
}
