"use server"

import { prisma } from "@/lib/prisma"

export async function searchAnimalsByName(term: string) {
  return prisma.animal.findMany({
    where: {
      nome: { contains: term, mode: "insensitive" },
    },
    select: {
      id: true,
      nome: true,
      fotos: {
        where: { principal: true },
        select: { urlFoto: true },
      },
    },
    take: 5,
  })
}
