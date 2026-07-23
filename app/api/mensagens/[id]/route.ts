import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth";
import { isActiveSession } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();
  if (!session?.user?.id || !isActiveSession(session)) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }
  if (!["ADOTANTE", "ORGANIZACAO", "ACOLHEDOR"].includes(session.user.tipoPerfil)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id: conversationId } = await params;
  const participant = await prisma.conversaParticipante.findUnique({
    where: {
      conversaId_usuarioId: {
        conversaId: conversationId,
        usuarioId: session.user.id,
      },
    },
    select: { conversa: { select: { status: true } } },
  });
  if (!participant) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const afterValue = request.nextUrl.searchParams.get("after");
  const after = afterValue ? new Date(afterValue) : undefined;
  if (after && Number.isNaN(after.getTime())) {
    return NextResponse.json({ error: "Cursor invalido" }, { status: 400 });
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
    messages,
    status: participant.conversa.status,
  });
}
