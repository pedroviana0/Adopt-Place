"use server";

import { UTApi } from "uploadthing/server";

import { getServerSession } from "@/lib/auth";
import { type AppSession, isActiveSession, isResponsibleUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type ActionResult = { success?: boolean; error?: string };

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

export async function deleteDocumentoSaude(
  documentId: string,
): Promise<ActionResult> {
  const session = await getServerSession();

  if (!session?.user?.id) return { error: "Nao autenticado" };
  if (!isActiveSession(session)) return { error: "Conta desativada" };
  if (!isResponsibleUser(session)) {
    return { error: "Apenas responsaveis podem excluir documentos de saude" };
  }

  const document = await prisma.documentoSaude.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      chaveArquivo: true,
      animal: { select: { organizacaoId: true, acolhedorId: true } },
    },
  });

  if (!document) return { error: "Documento nao encontrado" };
  if (!ownsAnimal(session, document.animal)) return { error: "Acesso negado" };

  await prisma.documentoSaude.delete({ where: { id: documentId } });

  if (document.chaveArquivo) {
    try {
      await new UTApi().deleteFiles(document.chaveArquivo);
    } catch {
      // Metadata remains authoritative when provider cleanup is unavailable.
    }
  }

  return { success: true };
}
