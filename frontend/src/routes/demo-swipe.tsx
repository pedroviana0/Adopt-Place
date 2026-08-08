import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Heart, X } from "lucide-react";

import {
  SwipeableCardStack,
  type SwipeDirection,
} from "@/components/ui/tinder-like-swipe";

// Rota temporária de verificação do componente de swipe. Não faz parte do
// produto: sai quando a tela do Feels (spec 005) existir de verdade.
export const Route = createFileRoute("/demo-swipe")({
  component: TinderSwipeDemo,
});

const images = [
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80",
];

const labels = ["Cachorro caramelo", "Golden retriever", "Filhote deitado"];

function TinderSwipeDemo() {
  const [log, setLog] = React.useState<{ label: string; direction: SwipeDirection }[]>(
    [],
  );

  return (
    <div className="page-canvas flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-6 px-4 py-8">
      <div className="h-[400px] w-[300px] shrink-0">
        <SwipeableCardStack
          images={images}
          imageLabels={labels}
          borderRadius={20}
          rightIcon={<Heart className="h-20 w-20 text-white" fill="currentColor" />}
          leftIcon={<X className="h-20 w-20 text-white" strokeWidth={3} />}
          onSwipe={(direction, _image, index) =>
            setLog((prev) => [{ label: labels[index] ?? `Item ${index + 1}`, direction }, ...prev])
          }
        />
      </div>

      <div data-testid="swipe-log" className="w-[300px] text-sm">
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
                <span className="truncate">{entry.label}</span>
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
