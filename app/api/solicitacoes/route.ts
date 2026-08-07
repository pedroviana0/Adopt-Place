import {
  Prisma,
  StatusAnimal,
  StatusSolicitacao,
} from "@prisma/client";
import { NextResponse } from "next/server";

import {
  apiError,
  requireActiveAdopter,
} from "@/lib/api/adopter-context";
import { notificar } from "@/lib/notificacoes";
import { prisma } from "@/lib/prisma";
import {
  adopterRequestSelect,
  getAdopterRequests,
  toAdopterRequestDTO,
} from "@/lib/queries/adopter-requests";
import { adoptionRequestSchema } from "@/lib/schemas/solicitacao";

export async function GET() {
  const current = await requireActiveAdopter();
  if ("response" in current) {
    return current.response;
  }

  const requests = await getAdopterRequests(current.adotanteId);
  return NextResponse.json({ requests: requests.map(toAdopterRequestDTO) });
}

export async function POST(request: Request) {
  const current = await requireActiveAdopter();
  if ("response" in current) {
    return current.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "VALIDATION_ERROR", "JSON invalido.");
  }

  const parsed = adoptionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Revise os campos informados.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const adopter = await prisma.adotante.findUnique({
    where: { id: current.adotanteId },
    select: { triagemConcluida: true },
  });

  if (!adopter?.triagemConcluida) {
    return apiError(
      409,
      "SCREENING_REQUIRED",
      "Conclua a triagem antes de solicitar adocao.",
    );
  }

  const animal = await prisma.animal.findUnique({
    where: { id: parsed.data.animalId },
    select: {
      status: true,
      nome: true,
      organizacao: { select: { usuarioId: true } },
      acolhedor: { select: { usuarioId: true } },
    },
  });

  if (animal?.status !== StatusAnimal.DISPONIVEL) {
    return apiError(
      409,
      "ANIMAL_UNAVAILABLE",
      "Animal indisponivel para adocao.",
    );
  }

  const activeRequest = await prisma.solicitacaoAdocao.findFirst({
    where: {
      adotanteId: current.adotanteId,
      animalId: parsed.data.animalId,
      status: {
        in: [StatusSolicitacao.EM_ANALISE, StatusSolicitacao.APROVADA],
      },
    },
    select: { id: true },
  });

  if (activeRequest) {
    return apiError(
      409,
      "ACTIVE_REQUEST_EXISTS",
      "Voce ja tem uma solicitacao ativa para este animal.",
    );
  }

  try {
    const created = await prisma.solicitacaoAdocao.create({
      data: {
        adotanteId: current.adotanteId,
        animalId: parsed.data.animalId,
        status: StatusSolicitacao.EM_ANALISE,
      },
      select: adopterRequestSelect,
    });

    // Avisa o responsável pelo animal que há uma nova solicitação.
    const donoUsuarioId =
      animal.organizacao?.usuarioId ?? animal.acolhedor?.usuarioId;
    if (donoUsuarioId) {
      const adotante = await prisma.adotante.findUnique({
        where: { id: current.adotanteId },
        select: { nomeCompleto: true },
      });
      await notificar({
        usuarioId: donoUsuarioId,
        tipo: "SOLICITACAO_RECEBIDA",
        titulo: "Nova solicitação de adoção",
        mensagem: `${adotante?.nomeCompleto ?? "Um adotante"} quer adotar ${animal.nome}.`,
        href: `/dashboard/solicitacoes/${created.id}`,
      });
    }

    return NextResponse.json(
      { request: toAdopterRequestDTO(created) },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError(
        409,
        "REQUEST_ALREADY_EXISTS",
        "Ja existe uma solicitacao para este animal.",
      );
    }
    throw error;
  }
}
