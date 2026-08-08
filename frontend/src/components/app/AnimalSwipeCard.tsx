import { MapPin } from "lucide-react";

import { descreverAnimal } from "@/lib/animal-descricao";
import type { PublicAnimalSummary } from "@/lib/data/animais";
import { sexoLabel } from "@/lib/domain/enums";
import type { Sexo } from "@/lib/domain/enums";

// Conteúdo do cartão do Feels, sobreposto à foto. A hierarquia é deliberada:
// nome e idade decidem, espécie+porte é o bloqueio prático seguinte, e o resto
// é contexto. Etiquetas de saúde ficam no perfil do animal — no swipe elas
// competiriam com a foto sem mudar a decisão.
export function AnimalSwipeCard({
  animal,
  distanciaKm,
}: {
  animal: PublicAnimalSummary;
  distanciaKm?: number | null;
}) {
  const descricao = descreverAnimal(animal.especie, animal.sexo, animal.porte);
  const local = [animal.cidade, formatarDistancia(distanciaKm)]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 pt-16">
      {/* Véu: sem ele o texto perde contraste sobre foto clara. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0) 100%)",
        }}
      />

      <div className="relative">
        <p className="font-serif text-3xl font-semibold leading-tight text-white">
          {animal.nome}
          {animal.idadeEstimada && (
            <span className="text-2xl font-normal text-white/85">
              , {animal.idadeEstimada}
            </span>
          )}
        </p>

        {descricao && <p className="mt-1 text-xl text-white/85">{descricao}</p>}

        <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-white/75">
          <span>{sexoLabel[animal.sexo as Sexo] ?? animal.sexo}</span>
          {local && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {local}
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function formatarDistancia(km: number | null | undefined): string | null {
  if (km === null || km === undefined) return null;
  return km < 1 ? "menos de 1 km" : `a ${Math.round(km)} km`;
}
