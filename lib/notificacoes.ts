import type { Prisma, TipoNotificacao } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type NotificacaoInput = {
  usuarioId: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  href?: string;
};

// Cria notificações in-app. Aceita um client de transação para participar do
// mesmo commit da ação que gerou o evento; sem ele, usa o client padrão.
//
// Nunca lança: a notificação é um efeito colateral informativo e não deve
// derrubar a operação principal (aprovar solicitação, concluir adoção, etc.).
export async function notificar(
  entradas: NotificacaoInput | NotificacaoInput[],
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const lista = Array.isArray(entradas) ? entradas : [entradas];
  if (lista.length === 0) return;

  const client = tx ?? prisma;
  try {
    await client.notificacao.createMany({
      data: lista.map((n) => ({
        usuarioId: n.usuarioId,
        tipo: n.tipo,
        titulo: n.titulo,
        mensagem: n.mensagem,
        href: n.href ?? null,
      })),
    });
  } catch (error) {
    console.error("Falha ao registrar notificacao", error);
  }
}
