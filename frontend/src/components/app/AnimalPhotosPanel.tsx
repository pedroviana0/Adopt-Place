import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Info, Star, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  definirFotoPrincipal,
  excluirFoto,
  reordenarFotos,
  type OwnedFoto,
} from "@/lib/data/animais";
import {
  MIN_ANIMAL_PHOTOS,
  uploadAnimalPhoto,
  validateAnimalPhoto,
} from "@/lib/data/animal-photo-upload";
import { ConfirmDestructiveAction } from "@/components/app/ConfirmDestructiveAction";

export function AnimalPhotosPanel({
  animalId,
  fotos,
  status,
}: {
  animalId: string;
  fotos: OwnedFoto[];
  status: string;
}) {
  const anunciado = status === "DISPONIVEL";
  // Enquanto o animal está na vitrine, o acervo não pode cair abaixo do mínimo
  // do anúncio. O backend recusa de qualquer forma; aqui é só para não deixar
  // a pessoa tentar.
  const minimoFotos = anunciado ? MIN_ANIMAL_PHOTOS : 1;
  const podeRemover = fotos.length > minimoFotos;
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["animal-gerenciado", animalId] });

  const run = async (fn: () => Promise<void>, ok: string, throwOnError = false) => {
    try {
      await fn();
      await refresh();
      toast.success(ok);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro";
      toast.error(message);
      if (throwOnError) throw new Error(message);
    }
  };

  const principal = (fotoId: string) =>
    run(() => definirFotoPrincipal(animalId, fotoId), "Foto principal atualizada");

  const remover = async (foto: OwnedFoto) => {
    if (!podeRemover) {
      const motivo = anunciado
        ? `Um animal anunciado precisa manter pelo menos ${MIN_ANIMAL_PHOTOS} fotos. Envie outra foto ou tire o animal da vitrine antes de remover esta.`
        : "O animal precisa de pelo menos uma foto.";
      toast.error(motivo);
      throw new Error(motivo);
    }
    const novaPrincipalId = foto.principal ? fotos.find((f) => f.id !== foto.id)?.id : undefined;
    await run(() => excluirFoto(animalId, foto.id, novaPrincipalId), "Foto removida", true);
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

  const enviarFoto = async (file: File) => {
    const validationError = validateAnimalPhoto(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploading(true);
    try {
      await uploadAnimalPhoto(animalId, file);
      await refresh();
      toast.success("Foto adicionada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar a foto");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Label>Fotos ({fotos.length})</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Selecionar foto do animal"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void enviarFoto(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || fotos.length >= 10}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Enviando..." : "Adicionar foto"}
        </Button>
      </div>
      {!anunciado && fotos.length < MIN_ANIMAL_PHOTOS && (
        <p
          role="status"
          className="mb-3 flex items-start gap-2 rounded-lg border border-border bg-surface-subtle px-3 py-2 text-sm text-muted-foreground"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Para anunciar este animal na vitrine são necessárias pelo menos{" "}
            {MIN_ANIMAL_PHOTOS} fotos. {fotos.length === 0 ? "Nenhuma enviada" : "Falta 1"}.
          </span>
        </p>
      )}
      {fotos.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Este animal ainda nao tem fotos.
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
                  <ConfirmDestructiveAction
                    title="Remover esta foto?"
                    item={`Foto ${i + 1}${f.principal ? " (principal)" : ""}`}
                    consequence="A foto será removida permanentemente do cadastro do animal."
                    confirmLabel="Remover foto"
                    disabled={!podeRemover}
                    onConfirm={() => remover(f)}
                    trigger={
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-destructive"
                        aria-label="Remover foto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
