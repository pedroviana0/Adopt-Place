import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizarNomeMunicipio } from "@/lib/municipios";
import { prisma } from "@/lib/prisma";

const LIMITE = 20;

const filtroSchema = z.object({
  busca: z.string().trim().min(2, "Informe ao menos 2 letras.").max(80),
  uf: z
    .string()
    .trim()
    .length(2)
    .transform((valor) => valor.toUpperCase())
    .optional(),
});

// Lista de municipios para a escolha manual, usada quando o provedor de CEP
// esta fora do ar (FR-005). Publica e somente leitura: e a mesma base do IBGE
// que ja vai versionada no repositorio. Nao devolve coordenada.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = filtroSchema.safeParse({
    busca: searchParams.get("busca") ?? "",
    uf: searchParams.get("uf") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Busca invalida.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const municipios = await prisma.municipio.findMany({
    where: {
      // A busca usa a mesma normalizacao que o seed gravou, entao "sao paulo",
      // "SÃO PAULO" e "São  Paulo" encontram a mesma linha.
      nomeNormalizado: { contains: normalizarNomeMunicipio(parsed.data.busca) },
      ...(parsed.data.uf ? { uf: parsed.data.uf } : {}),
    },
    orderBy: [{ nome: "asc" }, { uf: "asc" }],
    take: LIMITE,
    select: { codigoIbge: true, nome: true, uf: true },
  });

  return NextResponse.json({ municipios });
}
