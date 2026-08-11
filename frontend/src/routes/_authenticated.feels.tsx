import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, X } from "lucide-react";
import { toast } from "sonner";

import { AnimalSwipeCard } from "@/components/app/AnimalSwipeCard";
import { AsyncState } from "@/components/app/AsyncState";
import { Button } from "@/components/ui/button";
import { SwipeableCardStack } from "@/components/ui/tinder-like-swipe";
import { setFavorito } from "@/lib/data/favoritos";
import {
  fetchFeels,
  lerPulados,
  obterPosicao,
  registrarPulado,
  RAIOS_KM,
  type FiltrosDoFeels,
  type RaioKm,
} from "@/lib/data/feels";
import { useSessao } from "@/lib/data/hooks";

export const Route = createFileRoute("/_authenticated/feels")({
  head: () => ({
    meta: [
      { title: "Feels — AdoptPlace" },
      {
        name: "description",
        content: "Conheça animais disponíveis para adoção, um de cada vez.",
      },
    ],
  }),
  component: FeelsPage,
});

const ESPECIES = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "cachorro", rotulo: "Cães" },
  { valor: "gato", rotulo: "Gatos" },
] as const;

function FeelsPage() {
  const sessao = useSessao();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [raioKm, setRaioKm] = useState<RaioKm | undefined>(undefined);
  const [especie, setEspecie] = useState<FiltrosDoFeels["especie"]>("todos");
  const [pulados, setPulados] = useState<string[]>(() => lerPulados());
  const [posicao, setPosicao] = useState<{ latitude: number; longitude: number } | null>(null);
  const [posicaoResolvida, setPosicaoResolvida] = useState(false);
  // Foto visível por animal: vive aqui porque o arraste vertical do cartão,
  // que pertence à pilha, também troca de foto.
  const [fotoPorAnimal, setFotoPorAnimal] = useState<Record<string, number>>({});

  const verFoto = (animalId: string, indice: number) =>
    setFotoPorAnimal((atual) => ({ ...atual, [animalId]: indice }));

  // Papel errado não é redirecionado em silêncio: quem chegou aqui com conta de
  // organização ou acolhedor via a tela sumir sem entender por quê.
  const papelErrado = Boolean(sessao) && sessao?.tipoPerfil !== "ADOTANTE";

  // Relê a posição a cada abertura da tela: quem está viajando vê a distância
  // de onde está, não de casa.
  useEffect(() => {
    let cancelado = false;
    void obterPosicao().then((p) => {
      if (cancelado) return;
      setPosicao(p);
      setPosicaoResolvida(true);
    });
    return () => {
      cancelado = true;
    };
  }, []);

  const feels = useQuery({
    queryKey: ["feels", raioKm, especie, posicao, pulados.length],
    queryFn: () =>
      fetchFeels({
        raioKm,
        especie,
        latitude: posicao?.latitude,
        longitude: posicao?.longitude,
        excluir: pulados,
      }),
    enabled: posicaoResolvida && sessao?.tipoPerfil === "ADOTANTE",
  });

  const curtir = useMutation({
    mutationFn: (animalId: string) => setFavorito(animalId, true),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favoritos"] }),
    onError: (_erro, animalId) => {
      const cartao = feels.data?.cartoes.find((c) => c.id === animalId);
      toast.error(
        `Não foi possível salvar ${cartao?.nome ?? "o animal"} nos favoritos. Tente de novo.`,
      );
    },
  });

  if (papelErrado) {
    return (
      <div className="page-canvas flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-10">
        <div className="max-w-sm text-center">
          <h1 className="font-serif text-2xl font-semibold">O Feels é para quem adota</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Você está em <span className="font-medium">{sessao?.email}</span>, uma conta
            de {sessao?.tipoPerfil === "ORGANIZACAO" ? "organização" : sessao?.tipoPerfil === "ACOLHEDOR" ? "acolhedor" : "administração"}.
            Curtir um animal salva nos favoritos de um adotante, então esta tela só
            existe para esse perfil.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Button onClick={() => navigate({ to: "/dashboard" })}>
              Ir para o painel
            </Button>
            <Link to="/vitrine" className="text-sm text-muted-foreground hover:underline">
              Ver os animais na vitrine
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!sessao) return null;

  const cartoes = feels.data?.cartoes ?? [];
  const cidades = feels.data?.cidades ?? [];
  const comFoto = cartoes.filter((c) => c.fotos.length > 0);

  const decidir = (direcao: "left" | "right", index: number) => {
    const cartao = comFoto[index];
    if (!cartao) return;

    if (direcao === "right") curtir.mutate(cartao.id);
    setPulados(registrarPulado(cartao.id));
  };

  return (
    <div className="page-canvas flex min-h-[calc(100dvh-4rem)] flex-col items-center gap-5 px-4 py-6">
      <header className="w-full max-w-sm">
        <h1 className="font-serif text-2xl font-semibold">Feels</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Arraste para os lados ou use ← → para decidir. Para ver as outras
          fotos: arraste para cima, dê dois cliques, ou use espaço e ↑ ↓.
          Curtir salva nos favoritos.
        </p>
      </header>

      <section aria-label="Filtros" className="w-full max-w-sm space-y-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Espécie">
          {ESPECIES.map((opcao) => (
            <Button
              key={opcao.valor}
              type="button"
              size="sm"
              variant={especie === opcao.valor ? "default" : "outline"}
              aria-pressed={especie === opcao.valor}
              onClick={() => setEspecie(opcao.valor)}
            >
              {opcao.rotulo}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Distância máxima">
          <Button
            type="button"
            size="sm"
            variant={raioKm === undefined ? "default" : "outline"}
            aria-pressed={raioKm === undefined}
            onClick={() => setRaioKm(undefined)}
          >
            Qualquer
          </Button>
          {RAIOS_KM.map((valor) => (
            <Button
              key={valor}
              type="button"
              size="sm"
              variant={raioKm === valor ? "default" : "outline"}
              aria-pressed={raioKm === valor}
              onClick={() => setRaioKm(valor)}
            >
              {valor} km
            </Button>
          ))}
        </div>

        {cidades.length > 0 && (
          // O raio em número é abstrato; as cidades tornam concreto o que ele
          // está alcançando.
          <p className="text-xs text-muted-foreground">
            Mostrando animais de{" "}
            {cidades.map((c, i) => (
              <span key={`${c.nome}-${c.estado}`}>
                {i > 0 && (i === cidades.length - 1 ? " e " : ", ")}
                <span className="font-medium text-foreground">{c.nome}</span>
                {c.distanciaKm > 0 && ` (${c.distanciaKm} km)`}
              </span>
            ))}
            .
          </p>
        )}
      </section>

      <AsyncState
        isLoading={feels.isLoading || !posicaoResolvida}
        isError={feels.isError}
        error={feels.error}
        isEmpty={!feels.isLoading && comFoto.length === 0}
        loadingLabel="Procurando animais perto de você…"
        errorTitle="Não foi possível carregar o Feels"
        onRetry={() => feels.refetch()}
        emptyState={{
          title: "Você viu todo mundo por aqui",
          description: raioKm
            ? `Nenhum animal novo em ${raioKm} km. Amplie a distância ou troque a espécie.`
            : "Nenhum animal novo com esses critérios. Troque a espécie ou veja seus favoritos.",
          action: raioKm
            ? { label: "Ampliar distância", onClick: () => setRaioKm(undefined) }
            : { label: "Ver meus favoritos", to: "/meus-favoritos" },
        }}
      >
        <div className="h-[460px] w-full max-w-sm shrink-0">
          <SwipeableCardStack
            images={comFoto.map((c) => c.fotos[0])}
            imageLabels={comFoto.map((c) => c.nome)}
            borderRadius={20}
            loop={false}
            rightActionLabel="Curtir"
            leftActionLabel="Dispensar"
            rightIcon={<Heart className="h-20 w-20 text-white" fill="currentColor" />}
            leftIcon={<X className="h-20 w-20 text-white" strokeWidth={3} />}
            renderOverlay={(_imagem, index, noTopo) => {
              const cartao = comFoto[index];
              return cartao ? (
                <AnimalSwipeCard
                  animal={cartao}
                  distanciaKm={cartao.distanciaKm}
                  ativo={noTopo}
                  indiceFoto={fotoPorAnimal[cartao.id] ?? 0}
                  onIndiceFoto={(indice) => verFoto(cartao.id, indice)}
                />
              ) : null;
            }}
            onSwipe={(direcao, _imagem, index) => decidir(direcao, index)}
            onSwipeVertical={(direcao, index) => {
              const cartao = comFoto[index];
              if (!cartao || cartao.fotos.length < 2) return;
              const atual = fotoPorAnimal[cartao.id] ?? 0;
              // Arrastar para cima avança, como num feed de vídeo.
              const passo = direcao === "cima" ? 1 : -1;
              verFoto(cartao.id, atual + passo);
            }}
          />
        </div>
      </AsyncState>

      <div className="flex w-full max-w-sm items-center justify-between text-sm">
        <Link to="/meus-favoritos" className="text-muted-foreground hover:underline">
          Meus favoritos
        </Link>
        <Link to="/vitrine" className="text-muted-foreground hover:underline">
          Ver com filtros
        </Link>
      </div>
    </div>
  );
}
