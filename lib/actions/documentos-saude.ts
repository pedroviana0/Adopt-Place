"use server";

import { TipoPerfil } from "@prisma/client";
import { UTApi } from "uploadthing/server";

import { getResponsibleContext } from "@/lib/api/responsible-context";
import { prisma } from "@/lib/prisma";

type ActionResult = { success?: boolean; error?: string };

export async function deleteDocumentoSaude(
  documentId: string,
): Promise<ActionResult> {
  const current = await getResponsibleContext();
  if ("error" in current) return { error: current.error.message };

  const document = await prisma.documentoSaude.findFirst({
    where: {
      id: documentId,
      animal:
        current.context.tipoPerfil === TipoPerfil.ORGANIZACAO
          ? { organizacaoId: current.context.responsavelId }
          : { acolhedorId: current.context.responsavelId },
    },
    select: {
      id: true,
      chaveArquivo: true,
    },
  });

  if (!document) return { error: "Documento nao encontrado" };

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
