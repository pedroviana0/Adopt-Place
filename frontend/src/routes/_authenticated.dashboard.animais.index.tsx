import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil } from "lucide-react";
import { useSessao } from "@/lib/data/hooks";
import { fetchAnimaisGerenciados } from "@/lib/data/animais";
import { StatusBadge } from "@/components/app/StatusBadge";
import { EmptyState } from "@/components/app/EmptyState";
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
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">Meus animais</h1>
        {canCreate && (
          <Button asChild size="sm">
            <Link to="/dashboard/animais/novo">
              <Plus className="mr-1 h-4 w-4" /> Novo animal
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome…"
          className="max-w-xs"
        />
        <Select value={status || "__all"} onValueChange={(v) => setStatus(v === "__all" ? "" : v)}>
          <SelectTrigger className="w-48">
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
      </div>

      {animais.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Carregando…</p>
      ) : animais.isError ? (
        <div className="mt-6">
          <EmptyState
            title="Não foi possível carregar seus animais"
            action={{ label: "Tentar novamente", onClick: () => animais.refetch() }}
          />
        </div>
      ) : list.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Nenhum animal encontrado"
            description="Cadastre animais ou ajuste a busca para começar."
          />
        </div>
      ) : (
        <ul className="mt-6 divide-y rounded-xl border bg-card">
          {list.map((a) => (
            <li key={a.id} className="flex items-center gap-4 p-3">
              {a.fotoPrincipal && (
                <img
                  src={a.fotoPrincipal.urlFoto}
                  alt=""
                  className="h-14 w-14 rounded-md object-cover"
                />
              )}
              <div className="flex-1">
                <Link
                  to="/dashboard/animais/$animalId"
                  params={{ animalId: a.id }}
                  className="font-medium hover:underline"
                >
                  {a.nome}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {a.cor} · {a.idadeEstimada ?? "—"}
                  {a.solicitacoesEmAnalise > 0 &&
                    ` · ${a.solicitacoesEmAnalise} solicitação(ões) em análise`}
                </p>
              </div>
              <StatusBadge status={a.status} />
              <Button asChild size="sm" variant="ghost" aria-label={`Editar ${a.nome}`}>
                <Link to="/dashboard/animais/$animalId" params={{ animalId: a.id }}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
