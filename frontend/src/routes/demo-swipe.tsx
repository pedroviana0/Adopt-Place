import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, X } from "lucide-react";

import { AnimalSwipeCard } from "@/components/app/AnimalSwipeCard";
import { AsyncState } from "@/components/app/AsyncState";
import {
  SwipeableCardStack,
  type SwipeDirection,
} from "@/components/ui/tinder-like-swipe";
import { fetchVitrine } from "@/lib/data/animais";

// Rota temporária de verificação do cartão do Feels com dados reais.
// Não faz parte do produto: sai quando a tela do Feels (spec 005) existir,
// com sessão de adotante, favoritos e ordenação por distância.
export const Route = createFileRoute("/demo-swipe")({
  component: FeelsCardPreview,
});

function FeelsCardPreview() {
  const [log, setLog] = React.useState<{ nome: string; direction: SwipeDirection }[]>(
    [],
  );

  const vitrine = useQuery({
    queryKey: ["demo-swipe-animais"],
    queryFn: () => fetchVitrine({ page: 1 }),
  });

  // Só animais com foto: um cartão sem imagem não sustenta a decisão por gesto.
  const animais = (vitrine.data?.animals ?? []).filter((a) => a.fotoPrincipal);

  return (
    <div className="page-canvas flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-6 px-4 py-8">
      <AsyncState
        isLoading={vitrine.isLoading}
        isError={vitrine.isError}
        error={vitrine.error}
        isEmpty={!vitrine.isLoading && animais.length === 0}
        onRetry={() => vitrine.refetch()}
        emptyState={{
          title: "Nenhum animal com foto",
          description: "A pilha precisa de pelo menos um animal disponível com foto.",
        }}
      >
        <div className="h-[460px] w-[320px] shrink-0">
          <SwipeableCardStack
            images={animais.map((a) => a.fotoPrincipal as string)}
            imageLabels={animais.map((a) => a.nome)}
            borderRadius={20}
            rightIcon={<Heart className="h-20 w-20 text-white" fill="currentColor" />}
            leftIcon={<X className="h-20 w-20 text-white" strokeWidth={3} />}
            renderOverlay={(_image, index) => {
              const animal = animais[index];
              return animal ? <AnimalSwipeCard animal={animal} /> : null;
            }}
            onSwipe={(direction, _image, index) =>
              setLog((prev) => [
                { nome: animais[index]?.nome ?? "?", direction },
                ...prev,
              ])
            }
          />
        </div>
      </AsyncState>

      <div data-testid="swipe-log" className="w-[320px] text-sm">
        <p className="mb-1 font-medium">
          Decisões: <span data-testid="swipe-count">{log.length}</span>
        </p>
        {log.length === 0 ? (
          <p className="text-muted-foreground">
            Arraste o cartão, ou use as setas ← → com ele focado.
          </p>
        ) : (
          <ul className="space-y-1">
            {log.map((entry, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className="truncate">{entry.nome}</span>
                <span
                  className={
                    entry.direction === "right" ? "text-success" : "text-destructive"
                  }
                >
                  {entry.direction === "right" ? "Curtiu" : "Dispensou"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
