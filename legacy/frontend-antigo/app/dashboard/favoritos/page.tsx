import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge, Button, Card, CardContent } from "@/components/ui";
import { getServerSession } from "@/lib/auth";
import { getAdopterFavorites } from "@/lib/queries/favorites";
import { getAnimalTags } from "@/lib/tags";

export default async function FavoritesPage() {
  const session = await getServerSession();

  if (session?.user?.tipoPerfil !== "ADOTANTE" || !session.user.adotanteId) {
    redirect("/dashboard");
  }

  const favorites = await getAdopterFavorites(session.user.adotanteId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Favoritos</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Animais salvos para acompanhar e solicitar adoção.
        </p>
      </div>

      {favorites.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)]">Você ainda não favoritou nenhum animal.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map(({ animal }) => {
            const tags = getAnimalTags(animal);
            const photoUrl = animal.fotos[0]?.urlFoto;

            return (
              <Card key={animal.id} className="overflow-hidden">
                <div className="aspect-[4/3] bg-[var(--muted)]">
                  {photoUrl ? (
                    <div
                      aria-label={`Foto de ${animal.nome}`}
                      className="h-full w-full bg-cover bg-center"
                      role="img"
                      style={{ backgroundImage: `url(${photoUrl})` }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
                      Sem foto
                    </div>
                  )}
                </div>
                <CardContent className="space-y-3">
                  <div>
                    <h2 className="text-lg font-semibold">{animal.nome}</h2>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {animal.especie.nome}
                      {animal.raca ? `, ${animal.raca.nome}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag.key} variant="outline">
                        {tag.label}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full" type="button">
                    <Link href={`/animais/${animal.id}`}>Ver animal</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
