import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Link2 } from "lucide-react";
import { AsyncState } from "@/components/app/AsyncState";
import { AnimalImagePlaceholder } from "@/components/app/PublicAnimalCard";
import {
  fetchRelacionamentos,
  fetchAnimaisGerenciados,
  vincularAnimal,
  desvincularAnimal,
} from "@/lib/data/animais";

export function RelatedAnimalsPanel({ animalId }: { animalId: string }) {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const vinculosQuery = useQuery({
    queryKey: ["relacionamentos", animalId],
    queryFn: () => fetchRelacionamentos(animalId),
  });
  const vinculos = vinculosQuery.data ?? [];
  const idsVinculados = new Set(vinculos.map((v) => v.id));

  // Server-side search over the owner's own animals (Issue #41).
  const candidatosQuery = useQuery({
    queryKey: ["animais-gerenciados", { q: busca.trim() || undefined }],
    queryFn: () => fetchAnimaisGerenciados({ q: busca.trim() || undefined }),
  });
  const candidatos = (candidatosQuery.data ?? [])
    .filter((a) => a.id !== animalId && !idsVinculados.has(a.id))
    .slice(0, 10);

  const invalidate = () =>
    Promise.all([queryClient.invalidateQueries({ queryKey: ["relacionamentos", animalId] })]);

  const doVincular = async (outroId: string) => {
    setSaving(outroId);
    try {
      await vincularAnimal(animalId, outroId);
      await invalidate();
      toast.success("Vinculado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(null);
    }
  };

  const doDesvincular = async (outroId: string) => {
    setSaving(outroId);
    try {
      await desvincularAnimal(animalId, outroId);
      await invalidate();
      toast.success("Desvinculado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="min-w-0">
      <h2 className="font-serif text-xl font-semibold">Animais relacionados</h2>
      <p className="text-sm text-muted-foreground">
        Vincule animais que costumam ser adotados juntos (irmãos, dupla).
      </p>

      <div className="mt-4">
        <Label htmlFor="busca-rel" className="mb-1 block text-sm">
          Buscar entre meus animais
        </Label>
        <Input
          id="busca-rel"
          maxLength={100}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Digite o nome…"
        />
        <AsyncState
          isLoading={candidatosQuery.isLoading}
          isError={candidatosQuery.isError}
          error={candidatosQuery.error}
          onRetry={() => candidatosQuery.refetch()}
          className="mt-2"
        >
          {candidatos.length > 0 && (
            <ul className="mt-2 divide-y rounded-xl border bg-card">
              {candidatos.map((a) => (
                <li
                  key={a.id}
                  className="flex min-w-0 flex-wrap items-center gap-3 p-2 sm:flex-nowrap"
                >
                  {a.fotoPrincipal ? (
                    <img
                      src={a.fotoPrincipal.urlFoto}
                      alt={`Foto de ${a.nome}`}
                      className="h-10 w-10 rounded-md object-cover"
                    />
                  ) : (
                    <AnimalImagePlaceholder animalName={a.nome} className="h-10 w-10 rounded-md" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm">{a.nome}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={saving === a.id}
                    onClick={() => doVincular(a.id)}
                  >
                    <Link2 className="mr-1 h-3.5 w-3.5" />
                    {saving === a.id ? "Vinculando..." : "Vincular"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </AsyncState>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium">Vínculos atuais ({vinculos.length})</p>
        <AsyncState
          isLoading={vinculosQuery.isLoading}
          isError={vinculosQuery.isError}
          error={vinculosQuery.error}
          onRetry={() => vinculosQuery.refetch()}
          isEmpty={!vinculosQuery.isLoading && !vinculosQuery.isError && vinculos.length === 0}
          emptyState={{
            title: "Nenhum vínculo",
            description: "Busque outro animal acima para criar um vínculo.",
          }}
          className="mt-2"
        >
          <ul className="divide-y rounded-xl border bg-card">
            {vinculos.map((v) => (
              <li key={v.id} className="flex min-w-0 items-center gap-3 p-2">
                {v.fotoPrincipal ? (
                  <img
                    src={v.fotoPrincipal}
                    alt={`Foto de ${v.nome}`}
                    className="h-10 w-10 rounded-md object-cover"
                  />
                ) : (
                  <AnimalImagePlaceholder animalName={v.nome} className="h-10 w-10 rounded-md" />
                )}
                <span className="min-w-0 flex-1 truncate text-sm">{v.nome}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Desvincular ${v.nome}`}
                  disabled={saving === v.id}
                  onClick={() => doDesvincular(v.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </AsyncState>
      </div>
    </div>
  );
}
