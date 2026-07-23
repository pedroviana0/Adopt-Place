import { notFound } from "next/navigation";

import { RelatedAnimalManager } from "@/components/app/animais/related-animal-manager";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { requireResponsible } from "@/lib/actions/auth-guards";
import { prisma } from "@/lib/prisma";

export default async function AnimalRelacionadosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireResponsible();

  const responsavelId =
    session.user.tipoPerfil === "ORGANIZACAO"
      ? session.user.organizacaoId
      : session.user.acolhedorId;

  const { id: animalId } = await params;

  const animal = await prisma.animal.findUnique({
    where: { id: animalId },
    include: {
      relacionadosA: {
        include: {
          animalRelacionado: {
            select: {
              id: true,
              nome: true,
              fotos: {
                orderBy: [{ principal: "desc" }, { ordem: "asc" }],
                take: 1,
                select: { urlFoto: true, principal: true },
              },
            },
          },
        },
      },
    },
  });

  if (!animal) {
    notFound();
  }

  const isOwner =
    (session.user.tipoPerfil === "ORGANIZACAO" && animal.organizacaoId === responsavelId) ||
    (session.user.tipoPerfil === "ACOLHEDOR" && animal.acolhedorId === responsavelId);

  if (!isOwner) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Relacionados: {animal.nome}</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Gerencie animais relacionados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Animais Relacionados</h2>
        </CardHeader>
        <CardContent>
          <RelatedAnimalManager
            animalId={animalId}
            relatedAnimals={animal.relacionadosA.map((r) => r.animalRelacionado)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
