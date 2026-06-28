import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader } from "@/components/ui";
import { requireResponsible } from "@/lib/actions/auth-guards";
import { setPrimaryPhoto, updatePhotoOrder } from "@/lib/actions/fotos";
import { prisma } from "@/lib/prisma";

export default async function AnimalFotosPage({
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
    select: {
      id: true,
      nome: true,
      organizacaoId: true,
      acolhedorId: true,
      fotos: {
        orderBy: [{ principal: "desc" }, { ordem: "asc" }],
        select: { id: true, urlFoto: true, principal: true, ordem: true },
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
        <h1 className="text-2xl font-semibold">Fotos: {animal.nome}</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Organize as fotos do animal.
        </p>
      </div>

      {/* TODO T064 Uploadthing integration */}
      <p className="text-sm text-[var(--muted-foreground)]">
        Upload de fotos sera integrado via Uploadthing (T064).
      </p>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Galeria</h2>
        </CardHeader>
        <CardContent>
          {animal.fotos.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              Nenhuma foto cadastrada.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {animal.fotos.map((foto) => (
                <div key={foto.id} className="relative overflow-hidden rounded-md border">
                  <img
                    src={foto.urlFoto}
                    alt={"Foto de " + animal.nome}
                    className="aspect-square w-full object-cover"
                  />
                  {foto.principal && (
                    <span className="absolute left-2 top-2 rounded bg-[var(--primary)] px-2 py-1 text-xs text-white">
                      Principal
                    </span>
                  )}
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    <button
                      className="rounded bg-white/80 px-2 py-1 text-xs"
                      onClick={() => setPrimaryPhoto(foto.id)}
                    >
                      Definir principal
                    </button>
                    <button
                      className="rounded bg-white/80 px-2 py-1 text-xs"
                      onClick={() => {
                        const photos = animal.fotos.map((f, i) => ({
                          id: f.id,
                          order: f.id === foto.id ? (i > 0 ? i - 1 : 0) : i,
                        }));
                        updatePhotoOrder(photos);
                      }}
                    >
                      Reordenar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
