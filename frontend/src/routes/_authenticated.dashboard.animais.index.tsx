import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil } from "lucide-react";
import { z } from "zod";
import { useSessao } from "@/lib/data/hooks";
import { fetchAnimaisGerenciados, type FiltroLT } from "@/lib/data/animais";
import { AnimalIndicators } from "@/components/app/AnimalIndicators";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AsyncState } from "@/components/app/AsyncState";
import { AnimalImagePlaceholder } from "@/components/app/PublicAnimalCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SituacaoLT,
  StatusAnimal,
  situacaoLTLabel,
  statusAnimalLabel,
} from "@/lib/domain/enums";

// Filtros na URL: os cards do painel linkam para esta lista ja filtrada
// (spec 009, RF-019). Valor invalido na URL vira "sem filtro".
const filtroLTLabel: Record<FiltroLT, string> = {
  ...situacaoLTLabel,
  EM_LT_SEM_VINCULO: "Em LT sem registro",
};

const searchSchema = z.object({
  status: z
    .enum([
      StatusAnimal.EM_CUIDADOS,
      StatusAnimal.DISPONIVEL,
      StatusAnimal.EM_PROCESSO_ADOCAO,
      StatusAnimal.ADOTADO,
    ])
    .optional()
    .catch(undefined),
  lt: z
    .enum([
      SituacaoLT.NAO_SE_APLICA,
      SituacaoLT.PROCURANDO,
      SituacaoLT.EM_LT,
      "EM_LT_SEM_VINCULO",
    ])
    .optional()
    .catch(undefined),
  tratamento: z.literal("1").optional().catch(undefined),
});

export const Route = createFileRoute("/_authenticated/dashboard/animais/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Meus animais — AdoptPlace" },
      { name: "description", content: "Gerencie os animais sob seus cuidados." },
    ],
  }),
  component: Page,
});

function Page() {
  const s = useSessao();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [q, setQ] = useState("");
  const isOrganizacao = s?.tipoPerfil === "ORGANIZACAO";
  const status = search.status ?? "";
  // LT e so de organizacao: um `lt` na URL de acolhedor e ignorado, porque o
  // backend recusaria o filtro.
  const lt = isOrganizacao ? search.lt : undefined;
  const tratamento = search.tratamento;

  const setSearch = (next: Partial<z.infer<typeof searchSchema>>) =>
    navigate({ search: (prev) => ({ ...prev, ...next }), replace: true });

  const filters = { q: q.trim() || undefined, status: status || undefined, lt, tratamento };
  const animais = useQuery({
    queryKey: ["animais-gerenciados", filters],
    queryFn: () => fetchAnimaisGerenciados(filters),
    enabled: Boolean(s),
  });

  if (!s) return null;
  const canCreate = s.tipoPerfil === "ORGANIZACAO" || s.tipoPerfil === "ACOLHEDOR";
  const list = animais.data ?? [];
  const hasFilters = Boolean(q || status || lt || tratamento);

  return (
    <div className="min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-serif text-3xl font-semibold">Meus animais</h1>
        {canCreate && (
          <Button asChild size="sm">
            <Link to="/dashboard/animais/novo">
              <Plus className="mr-1 h-4 w-4" /> Novo animal
            </Link>
          </Button>
        )}
      </div>

      <section
        aria-label="Filtros dos animais"
        className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]"
      >
        <label htmlFor="animal-search" className="grid gap-1.5 text-sm font-medium">
          Buscar por nome
          <Input
            id="animal-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Digite o nome"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Status
          <Select
            value={status || "__all"}
            onValueChange={(v) =>
              setSearch({ status: v === "__all" ? undefined : (v as StatusAnimal) })
            }
          >
            <SelectTrigger aria-label="Filtrar por status" className="w-full">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos os status</SelectItem>
              {(Object.keys(statusAnimalLabel) as StatusAnimal[]).map((st) => (
                <SelectItem key={st} value={st}>
                  {statusAnimalLabel[st]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        {isOrganizacao && (
          <label className="grid gap-1.5 text-sm font-medium">
            Lar temporário (LT)
            <Select
              value={lt ?? "__all"}
              onValueChange={(v) =>
                setSearch({ lt: v === "__all" ? undefined : (v as FiltroLT) })
              }
            >
              <SelectTrigger aria-label="Filtrar por lar temporário" className="w-full">
                <SelectValue placeholder="Todas as situações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todas as situações</SelectItem>
                {(Object.keys(filtroLTLabel) as FiltroLT[]).map((opcao) => (
                  <SelectItem key={opcao} value={opcao}>
                    {filtroLTLabel[opcao]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        )}
        <div className="flex items-center gap-2 self-end pb-2">
          <Checkbox
            id="filtro-tratamento"
            checked={tratamento === "1"}
            onCheckedChange={(v) => setSearch({ tratamento: v === true ? "1" : undefined })}
          />
          <Label htmlFor="filtro-tratamento">Só em tratamento</Label>
        </div>
      </section>

      <AsyncState
        className="mt-6"
        isLoading={animais.isLoading}
        loadingFallback={<AnimalListSkeleton />}
        isError={animais.isError}
        error={animais.error}
        onRetry={() => animais.refetch()}
        isEmpty={!animais.isLoading && !animais.isError && list.length === 0}
        emptyState={{
          title: "Nenhum animal encontrado",
          description: hasFilters
            ? "Ajuste ou limpe os filtros para ampliar os resultados."
            : "Cadastre o primeiro animal sob seus cuidados.",
          action: hasFilters
            ? {
                label: "Limpar filtros",
                onClick: () => {
                  setQ("");
                  setSearch({ status: undefined, lt: undefined, tratamento: undefined });
                },
              }
              : canCreate
                ? { label: "Cadastrar animal", to: "/dashboard/animais/novo" }
                : undefined,
        }}
      >
        <ul className="mt-6 divide-y rounded-xl border bg-card">
          {list.map((a) => (
            <li
              key={a.id}
              className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 p-3 sm:grid-cols-[3.5rem_minmax(0,1fr)_auto_auto]"
            >
              {a.fotoPrincipal ? (
                <img
                  src={a.fotoPrincipal.urlFoto}
                  alt={`Foto de ${a.nome}`}
                  className="h-14 w-14 rounded-md object-cover"
                />
              ) : (
                <AnimalImagePlaceholder animalName={a.nome} className="h-14 w-14 rounded-md" />
              )}
              <div className="min-w-0">
                <Link
                  to="/dashboard/animais/$animalId"
                  params={{ animalId: a.id }}
                  className="font-medium hover:underline"
                >
                  {a.nome}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {a.cor} · {a.idadeEstimada ?? "—"}
                  {a.solicitacoesEmAnalise > 0 &&
                    ` · ${a.solicitacoesEmAnalise} solicitação(ões) em análise`}
                </p>
              </div>
              <span className="col-span-2 row-start-2 flex flex-wrap gap-1.5 justify-self-start sm:col-span-1 sm:row-start-auto sm:justify-self-end">
                <StatusBadge status={a.status} />
                <AnimalIndicators
                  emTratamento={a.emTratamento}
                  situacaoLT={isOrganizacao ? a.situacaoLT : SituacaoLT.NAO_SE_APLICA}
                  larTemporario={a.larTemporario}
                />
              </span>
              <Button asChild size="sm" variant="ghost" aria-label={`Editar ${a.nome}`}>
                <Link to="/dashboard/animais/$animalId" params={{ animalId: a.id }}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </AsyncState>
    </div>
  );
}

function AnimalListSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-xl border p-3">
          <Skeleton className="h-14 w-14 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48 max-w-full" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}
