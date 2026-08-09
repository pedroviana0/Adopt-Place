import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Home, ImageOff, MapPin } from "lucide-react";

import { descreverAnimal } from "@/lib/animal-descricao";
import { sexoLabel } from "@/lib/domain/enums";
import type { Sexo } from "@/lib/domain/enums";

/**
 * Só o que o cartão realmente mostra. Estreito de propósito: assim serve tanto
 * ao resumo da vitrine quanto ao cartão do Feels, sem que um precise fingir ser
 * o outro.
 */
export interface AnimalDoCartao {
  id?: string;
  nome: string;
  sexo: string;
  porte: string;
  idadeEstimada: string | null;
  especie: string | null;
  cidade: string | null;
  fotos?: string[];
  responsavel?: { tipo: "ORGANIZACAO" | "ACOLHEDOR"; nome: string | null };
}

/** Iniciais para o círculo, no mesmo padrão do menu de usuário. */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const letras = [partes[0]?.[0], partes.length > 1 ? partes[partes.length - 1][0] : ""]
    .filter(Boolean)
    .join("");
  return letras.toUpperCase() || "?";
}

/**
 * Conteúdo do cartão do Feels, sobreposto à foto. A hierarquia é deliberada:
 * nome e idade decidem, espécie+porte é o bloqueio prático seguinte, e o resto
 * é contexto. Etiquetas de saúde ficam no perfil do animal — no swipe elas
 * competiriam com a foto sem mudar a decisão.
 *
 * O carrossel existe porque uma foto só não sustenta a decisão: ninguém adota
 * um animal por um ângulo. As setas ← → pertencem a curtir e dispensar, então
 * trocar de foto usa toque nas laterais, botões visíveis e ↑ ↓ no teclado.
 */
export function AnimalSwipeCard({
  animal,
  distanciaKm,
  ativo = true,
  indiceFoto,
  onIndiceFoto,
}: {
  animal: AnimalDoCartao;
  distanciaKm?: number | null;
  /** Só o cartão do topo escuta teclado e mostra controles. */
  ativo?: boolean;
  /**
   * Índice da foto. Controlado de fora porque o arraste vertical do cartão —
   * que pertence à pilha — também troca de foto.
   */
  indiceFoto?: number;
  onIndiceFoto?: (indice: number) => void;
}) {
  const fotos = animal.fotos ?? [];
  const [falhou, setFalhou] = useState<Record<number, boolean>>({});

  const total = fotos.length;
  const temCarrossel = total > 1;
  const indice = total === 0 ? 0 : (((indiceFoto ?? 0) % total) + total) % total;

  const irPara = (proximo: number) => {
    if (total === 0) return;
    onIndiceFoto?.(((proximo % total) + total) % total);
  };

  useEffect(() => {
    if (!ativo || !temCarrossel) return;

    const aoTeclar = (evento: KeyboardEvent) => {
      const espaco = evento.key === " " || evento.key === "Spacebar";
      if (evento.key !== "ArrowUp" && evento.key !== "ArrowDown" && !espaco) return;
      if (evento.repeat || evento.metaKey || evento.ctrlKey || evento.altKey) return;

      const alvo = evento.target;
      if (alvo instanceof HTMLElement) {
        // Espaço aciona botão e link; dentro deles a tecla não é nossa.
        if (["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(alvo.tagName)) return;
        if (alvo.isContentEditable) return;
      }

      evento.preventDefault();
      const passo = evento.key === "ArrowUp" ? -1 : 1;
      onIndiceFoto?.(((indice + passo) % total + total) % total);
    };

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [ativo, temCarrossel, total, indice, onIndiceFoto]);

  const descricao = descreverAnimal(animal.especie, animal.sexo, animal.porte);
  const local = [animal.cidade, formatarDistancia(distanciaKm)].filter(Boolean).join(" · ");
  const fotoAtual = fotos[indice];

  // O arraste do cartão começa no pointerdown; sem barrar aqui, tocar num
  // controle do carrossel viraria início de swipe.
  const semArrastar = (evento: React.PointerEvent) => evento.stopPropagation();

  return (
    <div
      className="absolute inset-0"
      // Duplo clique avança a foto. Um clique simples fica livre porque o
      // cartão inteiro é área de arraste — clicar sem querer não pode agir.
      onDoubleClick={ativo && temCarrossel ? () => irPara(indice + 1) : undefined}
    >
      {fotoAtual && !falhou[indice] ? (
        <img
          src={fotoAtual}
          alt={`Foto ${indice + 1} de ${total} de ${animal.nome}`}
          className="h-full w-full object-cover"
          draggable={false}
          onError={() => setFalhou((f) => ({ ...f, [indice]: true }))}
        />
      ) : (
        <div className="grid h-full w-full place-items-center bg-surface-subtle text-muted-foreground">
          <div className="text-center">
            <ImageOff className="mx-auto h-8 w-8" aria-hidden="true" />
            <p className="mt-2 text-xs font-medium">
              {fotoAtual ? "Foto indisponível" : "Sem foto"}
            </p>
          </div>
        </div>
      )}

      {temCarrossel && (
        <>
          {/* Posição na sequência, no padrão que as pessoas já conhecem. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 flex gap-1 p-2"
          >
            {fotos.map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i === indice ? "bg-white" : "bg-white/35"
                }`}
              />
            ))}
          </div>

          {ativo && (
            <>
              {/* Faixas de toque: o gesto que já se espera de uma galeria. */}
              <button
                type="button"
                aria-label="Foto anterior"
                onPointerDown={semArrastar}
                // Sem isto, dois cliques na lateral acionariam o botao duas
                // vezes e ainda o duplo clique do cartao: tres fotos de uma vez.
                onDoubleClick={(evento) => evento.stopPropagation()}
                onClick={() => irPara(indice - 1)}
                className="group absolute inset-y-0 left-0 w-1/4 cursor-default focus-visible:outline-none"
              >
                <ChevronLeft
                  className="ml-1 h-7 w-7 text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-90 group-focus-visible:opacity-100"
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                aria-label="Próxima foto"
                onPointerDown={semArrastar}
                onDoubleClick={(evento) => evento.stopPropagation()}
                onClick={() => irPara(indice + 1)}
                className="group absolute inset-y-0 right-0 w-1/4 cursor-default focus-visible:outline-none"
              >
                <ChevronRight
                  className="ml-auto mr-1 h-7 w-7 text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-90 group-focus-visible:opacity-100"
                  aria-hidden="true"
                />
              </button>
            </>
          )}

          <p className="sr-only" role="status" aria-live="polite">
            {`Foto ${indice + 1} de ${total}`}
          </p>
        </>
      )}

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

          {animal.responsavel && animal.id && (
            <Link
              to="/animais/$animalId"
              params={{ animalId: animal.id }}
              // A área do texto ignora ponteiro para não atrapalhar o arraste;
              // este link precisa reativá-lo e não deixar o toque virar swipe.
              onPointerDown={semArrastar}
              className="pointer-events-auto mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 py-1 pl-1 pr-3 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span
                aria-hidden="true"
                className="grid h-7 w-7 place-items-center rounded-full bg-white/25 text-xs font-medium"
              >
                {animal.responsavel.tipo === "ORGANIZACAO" && animal.responsavel.nome ? (
                  iniciais(animal.responsavel.nome)
                ) : (
                  <Home className="h-3.5 w-3.5" />
                )}
              </span>
              <span className="max-w-[13rem] truncate">
                {animal.responsavel.nome ?? "Acolhedor independente"}
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function formatarDistancia(km: number | null | undefined): string | null {
  if (km === null || km === undefined) return null;
  return km < 1 ? "menos de 1 km" : `a ${Math.round(km)} km`;
}
