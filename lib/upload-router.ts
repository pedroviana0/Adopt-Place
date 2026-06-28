import { TipoPerfil } from "@prisma/client";
import { createUploadthing, type FileRouter, UTFiles } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";

import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const f = createUploadthing();

const animalPhotoInputSchema = z.object({
  animalId: z.string().min(1),
});

type ResponsibleRole = typeof TipoPerfil.ORGANIZACAO | typeof TipoPerfil.ACOLHEDOR;

function isResponsibleRole(tipoPerfil: TipoPerfil): tipoPerfil is ResponsibleRole {
  return tipoPerfil === TipoPerfil.ORGANIZACAO || tipoPerfil === TipoPerfil.ACOLHEDOR;
}

function getResponsavelId(
  tipoPerfil: ResponsibleRole,
  sessionUser: {
    organizacaoId: string | null;
    acolhedorId: string | null;
  },
): string | null {
  return tipoPerfil === TipoPerfil.ORGANIZACAO
    ? sessionUser.organizacaoId
    : sessionUser.acolhedorId;
}

export const uploadRouter = {
  animalPhoto: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
    .input(animalPhotoInputSchema)
    .middleware(async ({ files, input }) => {
      const session = await getServerSession();

      if (!session?.user?.id) {
        throw new UploadThingError("Unauthorized");
      }

      if (!session.user.ativo || !isResponsibleRole(session.user.tipoPerfil)) {
        throw new UploadThingError("Forbidden");
      }

      const responsavelId = getResponsavelId(session.user.tipoPerfil, session.user);

      if (!responsavelId) {
        throw new UploadThingError("Forbidden");
      }

      const animal = await prisma.animal.findUnique({
        where: { id: input.animalId },
        select: {
          organizacaoId: true,
          acolhedorId: true,
        },
      });

      const ownsAnimal =
        session.user.tipoPerfil === TipoPerfil.ORGANIZACAO
          ? animal?.organizacaoId === responsavelId
          : animal?.acolhedorId === responsavelId;

      if (!ownsAnimal) {
        throw new UploadThingError("Forbidden");
      }

      return {
        userId: session.user.id,
        responsavelId,
        tipoPerfil: session.user.tipoPerfil,
        [UTFiles]: files.map((file) => ({
          ...file,
          customId: input.animalId,
        })),
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      if (!file.customId) {
        throw new UploadThingError("Bad Request");
      }

      await prisma.fotoAnimal.create({
        data: {
          animalId: file.customId,
          urlFoto: file.url,
          principal: false,
          ordem: 0,
        },
      });

      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
