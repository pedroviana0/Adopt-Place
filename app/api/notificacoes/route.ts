import { NextResponse } from "next/server";

import { getServerSession, INACTIVE_ACCOUNT_MESSAGE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const LIMITE = 20;

async function requireActiveUser() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return {
      response: NextResponse.json(
        { error: { code: "UNAUTHENTICATED", message: "Autenticacao necessaria." } },
        { status: 401 },
      ),
    };
  }
  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { id: true, ativo: true },
  });
  if (!usuario?.ativo) {
    return {
      response: NextResponse.json(
        { error: { code: "INACTIVE_ACCOUNT", message: INACTIVE_ACCOUNT_MESSAGE } },
        { status: 403 },
      ),
    };
  }
  return { usuarioId: usuario.id };
}

// Lista as notificações do usuário autenticado (mais recentes) + total não lidas.
export async function GET() {
  const current = await requireActiveUser();
  if ("response" in current) return current.response;

  const [notifications, unread] = await Promise.all([
    prisma.notificacao.findMany({
      where: { usuarioId: current.usuarioId },
      orderBy: { criadoEm: "desc" },
      take: LIMITE,
      select: {
        id: true,
        tipo: true,
        titulo: true,
        mensagem: true,
        href: true,
        lidaEm: true,
        criadoEm: true,
      },
    }),
    prisma.notificacao.count({
      where: { usuarioId: current.usuarioId, lidaEm: null },
    }),
  ]);

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      tipo: n.tipo,
      titulo: n.titulo,
      mensagem: n.mensagem,
      href: n.href,
      lida: n.lidaEm !== null,
      criadoEm: n.criadoEm.toISOString(),
    })),
    unread,
  });
}

// Marca as notificações do usuário como lidas (idempotente).
export async function POST() {
  const current = await requireActiveUser();
  if ("response" in current) return current.response;

  await prisma.notificacao.updateMany({
    where: { usuarioId: current.usuarioId, lidaEm: null },
    data: { lidaEm: new Date() },
  });

  return NextResponse.json({ success: true });
}
