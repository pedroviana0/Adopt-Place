import { prisma } from "@/lib/prisma";

export async function getAllUsers() {
  return prisma.usuario.findMany({
    select: {
      id: true,
      email: true,
      tipoPerfil: true,
      ativo: true,
      criadoEm: true,
    },
    orderBy: { criadoEm: "desc" },
  });
}
