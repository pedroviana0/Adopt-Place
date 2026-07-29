import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  definirFotoPrincipal,
  excluirFoto,
  reordenarFotos,
  type OwnedFoto,
} from "@/lib/data/animais";

// Manages EXISTING photos of an owned animal (Issue #40): set primary, reorder,
// delete. Adding new photos requires the Uploadthing integration and is deferred
// (recorded gap) — the "add" affordance is disabled with a note.
export function AnimalPhotosPanel({ animalId, fotos }: { animalId: string; fotos: OwnedFoto[] }) {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["animal-gerenciado", animalId] });

  const run = async (fn: () => Promise<void>, ok: string) => {
    try {
      await fn();
      await refresh();
      toast.success(ok);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  const principal = (fotoId: string) =>
    run(() => definirFotoPrincipal(animalId, fotoId), "Foto principal atualizada");

  const remover = (foto: OwnedFoto) => {
    if (fotos.length <= 1) {
      toast.error("O animal precisa de pelo menos uma foto.");
      return;
    }
    const novaPrincipalId = foto.principal ? fotos.find((f) => f.id !== foto.id)?.id : undefined;
    run(() => excluirFoto(animalId, foto.id, novaPrincipalId), "Foto removida");
  };

  const mover = (idx: number, delta: number) => {
    const j = idx + delta;
    if (j < 0 || j >= fotos.length) return;
    const ordered = fotos.slice();
    [ordered[idx], ordered[j]] = [ordered[j], ordered[idx]];
    run(
      () =>
        reordenarFotos(
          animalId,
          ordered.map((f, i) => ({ id: f.id, ordem: i })),
        ),
      "Ordem das fotos atualizada",
    );
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Label>Fotos ({fotos.length})</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          title="Envio de novas fotos em breve (homologação)"
        >
          Adicionar fotos (em breve)
        </Button>
      </div>
      {fotos.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Este animal ainda não tem fotos. O envio de fotos será habilitado em breve.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {fotos.map((f, i) => (
            <li
              key={f.id}
              className={`relative overflow-hidden rounded-lg border-2 ${f.principal ? "border-primary" : "border-border"}`}
            >
              <div className="aspect-square">
                <img src={f.urlFoto} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
              </div>
              {f.principal && (
                <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Principal
                </span>
              )}
              <div className="flex items-center justify-between gap-1 border-t bg-card p-1.5">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    aria-label="Mover para cima"
                    disabled={i === 0}
                    onClick={() => mover(i, -1)}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    aria-label="Mover para baixo"
                    disabled={i === fotos.length - 1}
                    onClick={() => mover(i, 1)}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant={f.principal ? "default" : "outline"}
                    className="h-7 w-7"
                    aria-label="Definir como principal"
                    disabled={f.principal}
                    onClick={() => principal(f.id)}
                  >
                    <Star className={`h-3.5 w-3.5 ${f.principal ? "fill-current" : ""}`} />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    aria-label="Remover foto"
                    onClick={() => remover(f)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
