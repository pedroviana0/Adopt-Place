"use client";

import { Heart, Send } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { StatusAnimal } from "@prisma/client";

import { Button } from "@/components/ui";
import { createAdoptionRequest } from "@/lib/actions/solicitacoes";
import { toggleFavorite } from "@/lib/actions/favoritos";

type ProtectedActionButtonsProps = {
  animalId: string;
  animalStatus: StatusAnimal;
  isAuthenticated: boolean;
  hasCompletedTriagem: boolean;
  isFavorited: boolean;
};

function loginHref(pathname: string) {
  return `/login?callbackUrl=${encodeURIComponent(pathname)}`;
}

export function ProtectedActionButtons({
  animalId,
  animalStatus,
  isAuthenticated,
  hasCompletedTriagem,
  isFavorited,
}: ProtectedActionButtonsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticFavorited, setOptimisticFavorited] = useOptimistic(
    isFavorited,
    (_current: boolean, next: boolean) => next,
  );
  const canRequest = animalStatus === "DISPONIVEL";

  function requireAuthenticated(): boolean {
    if (isAuthenticated) {
      return true;
    }

    router.push(loginHref(pathname));
    return false;
  }

  function handleRequest() {
    if (!requireAuthenticated()) {
      return;
    }

    if (!hasCompletedTriagem) {
      router.push("/dashboard/triagem");
      return;
    }

    startTransition(async () => {
      const result = await createAdoptionRequest(animalId);

      if (!result.error) {
        router.refresh();
      }
    });
  }

  function handleFavorite() {
    if (!requireAuthenticated()) {
      return;
    }

    startTransition(async () => {
      setOptimisticFavorited(!optimisticFavorited);
      const result = await toggleFavorite(animalId);

      if (result.error) {
        setOptimisticFavorited(optimisticFavorited);
      }

      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {canRequest ? (
        <Button
          onClick={handleRequest}
          disabled={isPending}
          title={!hasCompletedTriagem && isAuthenticated ? "Complete seu perfil de triagem primeiro" : undefined}
          className="gap-2"
        >
          <Send aria-hidden="true" size={16} />
          Solicitar Adoção
        </Button>
      ) : null}
      <Button
        onClick={handleFavorite}
        disabled={isPending}
        variant={optimisticFavorited ? "secondary" : "outline"}
        className="gap-2"
        aria-pressed={optimisticFavorited}
      >
        <Heart aria-hidden="true" size={16} fill={optimisticFavorited ? "currentColor" : "none"} />
        {optimisticFavorited ? "Favoritado" : "Favoritar"}
      </Button>
    </div>
  );
}
