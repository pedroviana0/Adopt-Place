import { createFileRoute } from "@tanstack/react-router";
import { Heart, X } from "lucide-react";

import { SwipeableCardStack } from "@/components/ui/tinder-like-swipe";

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

function TinderSwipeDemo() {
  return (
    <div className="page-canvas grid min-h-[calc(100dvh-4rem)] place-items-center px-4">
      <div className="h-[400px] w-[300px]">
        <SwipeableCardStack
          images={images}
          imageLabels={["Cachorro caramelo", "Golden retriever", "Filhote deitado"]}
          borderRadius={20}
          rightIcon={<Heart className="h-20 w-20 text-white" fill="currentColor" />}
          leftIcon={<X className="h-20 w-20 text-white" strokeWidth={3} />}
        />
      </div>
    </div>
  );
}
