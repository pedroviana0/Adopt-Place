import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil } from "lucide-react";
import { useSessao } from "@/lib/data/hooks";
import { fetchAnimaisGerenciados } from "@/lib/data/animais";
import { StatusBadge } from "@/components/app/StatusBadge";
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
import { StatusAnimal, statusAnimalLabel } from "@/lib/domain/enums";

export const Route = createFileRoute("/_authenticated/dashboard/animais/")({
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
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");

  const filters = { q: q.trim() || undefined, status: status || undefined };
  const animais = useQuery({
    queryKey: ["animais-gerenciados", filters],
    queryFn: () => fetchAnimaisGerenciados(filters),
  });

  if (!s) return null;
  const canCreate = s.tipoPerfil === "ORGANIZACAO" || s.tipoPerfil === "ACOLHEDOR";
  const list = animais.data ?? [];

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

      <section aria-label="Filtros dos animais" className="mt-4 grid gap-3 sm:grid-cols-2">
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
            onValueChange={(v) => setStatus(v === "__all" ? "" : v)}
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
          description:
            q || status
              ? "Ajuste ou limpe os filtros para ampliar os resultados."
              : "Cadastre o primeiro animal sob seus cuidados.",
          action:
            q || status
              ? {
                  label: "Limpar filtros",
                  onClick: () => {
                    setQ("");
                    setStatus("");
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
              <span className="col-span-2 row-start-2 justify-self-start sm:col-span-1 sm:row-start-auto">
                <StatusBadge status={a.status} />
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
