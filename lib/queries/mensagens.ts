import { StatusConversaAdocao } from "@prisma/client";

import { AuthGuardError, requireSession } from "@/lib/actions/auth-guards";
import type { AppSession } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  conversationFilterSchema,
  type ConversationFilters,
} from "@/lib/schemas/dashboard-filters";

async function requireMessageParticipant(): Promise<AppSession> {
  const session = await requireSession();
  if (![
    "ADOTANTE",
    "ORGANIZACAO",
    "ACOLHEDOR",
  ].includes(session.user.tipoPerfil)) {
    throw new AuthGuardError("Acesso negado.");
  }
  return session;
}

function conversationStatus(status: ConversationFilters["status"]) {
  if (status === "ativas") return StatusConversaAdocao.ATIVA;
  if (status === "arquivadas") return StatusConversaAdocao.ARQUIVADA;
  return undefined;
}

function counterpartyLabel(user: {
  adotante: { nomeCompleto: string } | null;
  organizacao: { razaoSocial: string } | null;
  acolhedor: { nomeCompleto: string } | null;
} | undefined): string {
  return user?.adotante?.nomeCompleto
    ?? user?.organizacao?.razaoSocial
    ?? user?.acolhedor?.nomeCompleto
    ?? "Participante";
}

async function unreadByConversation(
  userId: string,
  participants: Array<{ conversaId: string; ultimaLeituraEm: Date | null }>,
): Promise<Map<string, number>> {
  const counts = new Map(participants.map((participant) => [participant.conversaId, 0]));
  if (participants.length === 0) return counts;

  const messages = await prisma.mensagemAdocao.findMany({
    where: {
      conversaId: { in: participants.map((participant) => participant.conversaId) },
      autorUsuarioId: { not: userId },
    },
    select: { conversaId: true, criadaEm: true },
  });
  const readAt = new Map(
    participants.map((participant) => [participant.conversaId, participant.ultimaLeituraEm]),
  );

  for (const message of messages) {
    const marker = readAt.get(message.conversaId);
    if (!marker || message.criadaEm > marker) {
      counts.set(message.conversaId, (counts.get(message.conversaId) ?? 0) + 1);
    }
  }
  return counts;
}

export async function getConversationList(rawFilters: ConversationFilters = {}) {
  const session = await requireMessageParticipant();
  const filters = conversationFilterSchema.parse(rawFilters);
  const status = conversationStatus(filters.status);
  const participants = await prisma.conversaParticipante.findMany({
    where: {
      usuarioId: session.user.id,
      ...(status ? { conversa: { status } } : {}),
    },
    orderBy: { conversa: { atualizadaEm: "desc" } },
    select: {
      conversaId: true,
      ultimaLeituraEm: true,
      conversa: {
        select: {
          id: true,
          status: true,
          atualizadaEm: true,
          solicitacao: {
            select: {
              id: true,
              animal: { select: { id: true, nome: true } },
            },
          },
          participantes: {
            where: { usuarioId: { not: session.user.id } },
            take: 1,
            select: {
              usuario: {
                select: {
                  adotante: { select: { nomeCompleto: true } },
                  organizacao: { select: { razaoSocial: true } },
                  acolhedor: { select: { nomeCompleto: true } },
                },
              },
            },
          },
          mensagens: {
            orderBy: { criadaEm: "desc" },
            take: 1,
            select: { texto: true, criadaEm: true, autorUsuarioId: true },
          },
        },
      },
    },
  });
  const unread = await unreadByConversation(session.user.id, participants);

  return participants.map((participant) => {
    const conversation = participant.conversa;
    const last = conversation.mensagens[0];
    return {
      id: conversation.id,
      requestId: conversation.solicitacao.id,
      animal: {
        ...conversation.solicitacao.animal,
        href: `/dashboard/animais/${conversation.solicitacao.animal.id}/saude`,
      },
      counterparty: {
        label: counterpartyLabel(conversation.participantes[0]?.usuario),
      },
      lastMessage: last
        ? {
            textPreview: last.texto,
            sentAt: last.criadaEm,
            authorIsMe: last.autorUsuarioId === session.user.id,
          }
        : undefined,
      status: conversation.status,
      unreadCount: unread.get(conversation.id) ?? 0,
      href: `/dashboard/mensagens/${conversation.id}`,
      updatedAt: conversation.atualizadaEm,
    };
  });
}

export async function getConversationDetail(conversationId: string) {
  const session = await requireMessageParticipant();
  const participant = await prisma.conversaParticipante.findUnique({
    where: {
      conversaId_usuarioId: {
        conversaId: conversationId,
        usuarioId: session.user.id,
      },
    },
    select: {
      ultimaLeituraEm: true,
      conversa: {
        select: {
          id: true,
          status: true,
          solicitacao: {
            select: {
              id: true,
              animal: { select: { id: true, nome: true } },
            },
          },
          participantes: {
            where: { usuarioId: { not: session.user.id } },
            take: 1,
            select: {
              usuario: {
                select: {
                  adotante: { select: { nomeCompleto: true } },
                  organizacao: { select: { razaoSocial: true } },
                  acolhedor: { select: { nomeCompleto: true } },
                },
              },
            },
          },
          mensagens: {
            orderBy: { criadaEm: "desc" },
            take: 50,
            select: {
              id: true,
              texto: true,
              criadaEm: true,
              autorUsuarioId: true,
            },
          },
        },
      },
    },
  });

  if (!participant) throw new AuthGuardError("Acesso negado.");
  const conversation = participant.conversa;
  return {
    id: conversation.id,
    requestId: conversation.solicitacao.id,
    animal: {
      ...conversation.solicitacao.animal,
      href: `/dashboard/animais/${conversation.solicitacao.animal.id}/saude`,
    },
    counterparty: {
      label: counterpartyLabel(conversation.participantes[0]?.usuario),
    },
    status: conversation.status,
    canSend: conversation.status === StatusConversaAdocao.ATIVA,
    messages: [...conversation.mensagens].reverse().map((message) => ({
      id: message.id,
      text: message.texto,
      sentAt: message.criadaEm,
      authorIsMe: message.autorUsuarioId === session.user.id,
    })),
  };
}

export async function getUnreadMessageCount(): Promise<number> {
  const session = await requireMessageParticipant();
  const participants = await prisma.conversaParticipante.findMany({
    where: { usuarioId: session.user.id },
    select: { conversaId: true, ultimaLeituraEm: true },
  });
  const unread = await unreadByConversation(session.user.id, participants);
  return [...unread.values()].reduce((total, count) => total + count, 0);
}

export type ConversationListItem = Awaited<
  ReturnType<typeof getConversationList>
>[number];
export type ConversationDetail = Awaited<ReturnType<typeof getConversationDetail>>;
