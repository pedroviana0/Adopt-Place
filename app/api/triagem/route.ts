import { Prisma, TipoPerfil } from "@prisma/client";
import { NextResponse } from "next/server";

import { getServerSession, INACTIVE_ACCOUNT_MESSAGE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adopterScreeningSchema } from "@/lib/schemas/adotante";

const screeningSelect = {
  motivoAdocao: true,
  tipoAnimalDesejado: true,
  podeArcarCustosVet: true,
  adocaoParaPresente: true,
  adocaoParaPresenteDetalhe: true,
  tipoMoradia: true,
  moradiaPropria: true,
  numAdultosCasa: true,
  temCriancas: true,
  criancasFaixaEtaria: true,
  todosConordamAdocao: true,
  condominioPermiteAnimal: true,
  janelasTeladas: true,
  acessoRua: true,
  murosSeguros: true,
  horasSozinho: true,
  responsavelViagem: true,
  planoEmGravidez: true,
  alergicosNaCasa: true,
  alergicosNaCasaDetalhe: true,
  planoMudanca: true,
  historicoDevolucao: true,
  historicoPercaDescuido: true,
  cienteLongevidade: true,
  permiteVisitaProtetor: true,
  ciendeNaoRepassar: true,
  teveAnimaisAntes: true,
  animaisAnterioresDescricao: true,
  temOutrosAnimais: true,
  outrosAnimaisDescricao: true,
  triagemConcluida: true,
} satisfies Prisma.AdotanteSelect;

function errorResponse(
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string[]>,
) {
  return NextResponse.json(
    { error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } },
    { status },
  );
}

async function currentAdopter(): Promise<
  { adotanteId: string } | { response: NextResponse }
> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return {
      response: errorResponse(
        401,
        "UNAUTHENTICATED",
        "Autenticacao necessaria.",
      ),
    };
  }

  const user = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: {
      ativo: true,
      tipoPerfil: true,
      adotante: { select: { id: true } },
    },
  });

  if (!user?.ativo) {
    return {
      response: errorResponse(
        403,
        "INACTIVE_ACCOUNT",
        INACTIVE_ACCOUNT_MESSAGE,
      ),
    };
  }

  if (user.tipoPerfil !== TipoPerfil.ADOTANTE || !user.adotante) {
    return {
      response: errorResponse(
        403,
        "ADOPTER_ONLY",
        "Acesso exclusivo para adotantes.",
      ),
    };
  }

  return { adotanteId: user.adotante.id };
}

export async function GET() {
  const current = await currentAdopter();
  if ("response" in current) {
    return current.response;
  }

  const screening = await prisma.adotante.findUnique({
    where: { id: current.adotanteId },
    select: screeningSelect,
  });

  if (!screening) {
    return errorResponse(404, "PROFILE_NOT_FOUND", "Perfil nao encontrado.");
  }

  return NextResponse.json({ screening });
}

export async function PUT(request: Request) {
  const current = await currentAdopter();
  if ("response" in current) {
    return current.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "VALIDATION_ERROR", "JSON invalido.");
  }

  const parsed = adopterScreeningSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Revise os campos informados.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const screening = await prisma.adotante.update({
    where: { id: current.adotanteId },
    data: {
      ...Object.fromEntries(
        Object.entries(parsed.data).map(([key, value]) => [
          key,
          value === undefined ? null : value,
        ]),
      ),
      triagemConcluida: true,
    },
    select: screeningSelect,
  });

  return NextResponse.json({ screening });
}
