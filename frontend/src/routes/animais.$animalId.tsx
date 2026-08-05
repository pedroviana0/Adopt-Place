import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { Heart, Send, MapPin } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { fetchPublicAnimal } from "@/lib/data/animais";
import { StatusBadge } from "@/components/app/StatusBadge";
import { AnimalImagePlaceholder, PublicAnimalCard } from "@/components/app/PublicAnimalCard";
import { EmptyState } from "@/components/app/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessao } from "@/lib/data/hooks";
import { fetchFavoritos, setFavorito } from "@/lib/data/favoritos";
import { criarSolicitacao } from "@/lib/data/solicitacoes";
import type { ApiError } from "@/lib/data/api";
import { toast } from "sonner";

export const Route = createFileRoute("/animais/$animalId")({
  head: () => ({
    meta: [
      { title: "Animal — AdoptPlace" },
      { name: "description", content: "Conheça este animal disponível para adoção no AdoptPlace." },
      { property: "og:title", content: "Animal — AdoptPlace" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnimalDetail,
});

// Public health-summary labels (Issue #26 decision: category presence only, no
// clinical specifics such as disease name/result).
const HEALTH_LABEL: Record<string, string> = {
  VACINA: "Vacinação",
  CONTROLE_PARASITAS: "Controle de parasitas",
  TESTE_DOENCA: "Teste de doença",
};

function AnimalDetail() {
  const { animalId } = Route.useParams();
  const sessao = useSessao();
  const router = useRouter();
  const navigate = useNavigate();
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [favSaving, setFavSaving] = useState(false);
  const [solSaving, setSolSaving] = useState(false);

  const queryClient = useQueryClient();
  const {
    data: animal,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["animal", animalId],
    queryFn: () => fetchPublicAnimal(animalId),
  });
  const isAdopter = sessao?.tipoPerfil === "ADOTANTE";
  const favoritosQuery = useQuery({
    queryKey: ["favoritos"],
    queryFn: fetchFavoritos,
    enabled: isAdopter,
  });
  const favorited = (favoritosQuery.data ?? []).some((f) => f.animalId === animalId);

  if (isLoading) {
    return (
      <div
        className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-5"
        aria-busy="true"
        aria-label="Carregando perfil do animal"
      >
        <Skeleton className="aspect-square w-full rounded-xl lg:col-span-3" />
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-12 w-56 max-w-full" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !animal) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <EmptyState
          title="Animal não encontrado"
          description="Este perfil pode ter sido removido ou não está mais disponível publicamente."
          action={{ label: "Voltar à vitrine", to: "/vitrine" }}
        />
      </div>
    );
  }

  const fotos = animal.fotos;
  const currentPath = router.state.location.pathname;
  const requireLogin = () => navigate({ to: "/login", search: { next: currentPath } });

  // Favoritar / solicitar adoção consomem a jornada do adotante real (Issue #33).
  const handleFavoritar = async () => {
    if (!sessao) return requireLogin();
    if (sessao.tipoPerfil !== "ADOTANTE") {
      toast.error("Apenas adotantes podem favoritar animais.");
      return;
    }
    setFavSaving(true);
    try {
      await setFavorito(animal.id, !favorited);
      await queryClient.invalidateQueries({ queryKey: ["favoritos"] });
      toast.success(!favorited ? "Adicionado aos favoritos" : "Removido dos favoritos");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao favoritar");
    } finally {
      setFavSaving(false);
    }
  };

  const handleSolicitar = async () => {
    if (!sessao) return requireLogin();
    if (sessao.tipoPerfil !== "ADOTANTE") {
      toast.error("Somente adotantes podem solicitar adoção.");
      return;
    }
    setSolSaving(true);
    try {
      await criarSolicitacao(animal.id);
      await queryClient.invalidateQueries({ queryKey: ["minhas-solicitacoes"] });
      toast.success("Solicitação enviada! Acompanhe em Minhas solicitações.");
      navigate({ to: "/minhas-solicitacoes" });
    } catch (e) {
      // Backend guards: screening required, unavailable animal, duplicate request.
      if ((e as ApiError).code === "SCREENING_REQUIRED") {
        toast.error("Você precisa concluir a triagem antes de solicitar uma adoção.");
        navigate({ to: "/triagem" });
      } else {
        toast.error(e instanceof Error ? e.message : "Erro ao solicitar");
      }
    } finally {
      setSolSaving(false);
    }
  };

  const categoriasSaude = Array.from(new Set(animal.resumoSaude.map((r) => r.tipo)));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid min-w-0 gap-8 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-3">
          {fotos.length > 0 ? (
            <>
              <div className="aspect-square overflow-hidden rounded-xl bg-muted">
                {photoFailed ? (
                  <AnimalImagePlaceholder animalName={animal.nome} failed />
                ) : (
                  <img
                    src={fotos[selectedPhoto]?.urlFoto}
                    alt={`Foto de ${animal.nome}`}
                    onError={() => setPhotoFailed(true)}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              {fotos.length > 1 && (
                <div
                  className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-1"
                  aria-label="Fotos do animal"
                >
                  {fotos.map((f, i) => (
                    <button
                      type="button"
                      key={f.id}
                      aria-label={`Exibir foto ${i + 1} de ${animal.nome}`}
                      aria-pressed={i === selectedPhoto}
                      onClick={() => {
                        setSelectedPhoto(i);
                        setPhotoFailed(false);
                      }}
                      className={`aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                        i === selectedPhoto
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border"
                      }`}
                    >
                      <img src={f.urlFoto} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-square overflow-hidden rounded-xl border border-border">
              <AnimalImagePlaceholder animalName={animal.nome} />
            </div>
          )}
        </div>

        <div className="min-w-0 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={animal.status} />
            {animal.cidade && (
              <span className="text-xs text-muted-foreground">
                <MapPin className="mr-0.5 inline h-3 w-3" />
                {animal.cidade}
              </span>
            )}
          </div>
          <h1 className="mt-2 break-words font-serif text-3xl font-semibold sm:text-4xl">
            {animal.nome}
          </h1>
          <div className="mt-3 flex flex-wrap gap-1">
            {animal.tags.map((t) => (
              <span
                key={t.key}
                className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
              >
                {t.label}
              </span>
            ))}
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-3 rounded-xl border bg-card p-4 text-sm sm:grid-cols-2">
            <Attr label="Espécie" value={animal.especie ?? "—"} />
            <Attr label="Raça" value={animal.raca ?? "SRD"} />
            <Attr label="Cor" value={animal.cor ?? "—"} />
            <Attr label="Idade" value={animal.idadeEstimada ?? "—"} />
          </dl>

          {animal.descricao && (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{animal.descricao}</p>
          )}

          {animal.responsavel && (
            <div className="mt-4 rounded-xl border bg-card p-4 text-sm">
              <p className="text-xs text-muted-foreground">Responsável</p>
              <p className="font-medium">{animal.responsavel}</p>
              {animal.cidade && <p className="text-xs text-muted-foreground">{animal.cidade}</p>}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2">
            {animal.status === "DISPONIVEL" && (
              <Button
                size="lg"
                onClick={handleSolicitar}
                disabled={solSaving}
                className="w-full gap-2"
              >
                <Send className="h-4 w-4" /> {solSaving ? "Enviando…" : "Solicitar adoção"}
              </Button>
            )}
            <Button
              size="lg"
              variant={favorited ? "default" : "outline"}
              onClick={handleFavoritar}
              disabled={favSaving}
              className="w-full gap-2"
            >
              <Heart className={`h-4 w-4 ${favorited ? "fill-current" : ""}`} />{" "}
              {favSaving ? "Salvando…" : favorited ? "Favoritado" : "Favoritar"}
            </Button>
          </div>
        </div>
      </div>

      {categoriasSaude.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-2xl font-semibold">Saúde</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {categoriasSaude.map((tipo) => (
              <span key={tipo} className="rounded-full border bg-card px-3 py-1 text-sm">
                {HEALTH_LABEL[tipo] ?? tipo}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Detalhes clínicos ficam disponíveis apenas ao responsável.
          </p>
        </section>
      )}

      {animal.relacionados.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-2xl font-semibold">Animais relacionados</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {animal.relacionados.map((a) => (
              <PublicAnimalCard key={a.id} animal={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Attr({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
