import { compare } from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const INACTIVE_ACCOUNT_MESSAGE =
  "Conta desativada. Entre em contato com o administrador";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function authorizeCredentials(rawCredentials: unknown) {
  const parsed = credentialsSchema.safeParse(rawCredentials);

  if (!parsed.success) {
    return null;
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email: parsed.data.email },
    include: {
      adotante: { select: { id: true } },
      organizacao: { select: { id: true } },
      acolhedor: { select: { id: true } },
    },
  });

  if (!usuario) {
    return null;
  }

  if (!usuario.ativo) {
    throw new Error(INACTIVE_ACCOUNT_MESSAGE);
  }

  const passwordMatches = await compare(parsed.data.password, usuario.senhaHash);

  if (!passwordMatches) {
    return null;
  }

  return {
    id: usuario.id,
    email: usuario.email,
    tipoPerfil: usuario.tipoPerfil,
    ativo: usuario.ativo,
    adotanteId: usuario.adotante?.id ?? null,
    organizacaoId: usuario.organizacao?.id ?? null,
    acolhedorId: usuario.acolhedor?.id ?? null,
  };
}
