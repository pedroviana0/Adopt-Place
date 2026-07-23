import { useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Trash2, Upload, ArrowUp, ArrowDown } from "lucide-react";

const MAX_FOTOS = 10;
import { animalSchema, type AnimalInput } from "@/lib/schemas/animal";
import { listEspecies, listRacas } from "@/lib/data/catalogos";
import {
  Porte,
  Sexo,
  StatusAnimal,
  porteLabel,
  sexoLabel,
  statusAnimalLabel,
} from "@/lib/domain/enums";
import type { Animal, FotoAnimal } from "@/lib/domain/types";
import type { SessaoUsuario } from "@/lib/domain/types";
import { createAnimal, updateAnimal, replaceFotos, listFotos } from "@/lib/data/animais";
import { compressImageToDataUrl, isQuotaExceeded, QUOTA_MESSAGE } from "@/lib/upload";

type PhotoDraft = { id?: string; url: string; principal: boolean };

interface Props {
  sessao: SessaoUsuario;
  animal?: Animal;
  mode: "create" | "edit";
}

export function AnimalForm({ sessao, animal, mode }: Props) {
  const navigate = useNavigate();
  const especies = listEspecies();
  const [form, setForm] = useState<AnimalInput>({
    nome: animal?.nome ?? "",
    especieId: animal?.especieId ?? "",
    racaId: animal?.racaId ?? null,
    porte: animal?.porte ?? Porte.M,
    sexo: animal?.sexo ?? Sexo.M,
    cor: animal?.cor ?? "",
    idadeEstimada: animal?.idadeEstimada ?? "",
    castrado: animal?.castrado ?? false,
    descricao: animal?.descricao ?? "",
    status: animal?.status ?? StatusAnimal.EM_CUIDADOS,
  });
  const racas = listRacas(form.especieId);
  const initialFotos: PhotoDraft[] = animal
    ? listFotos(animal.id).map((f: FotoAnimal) => ({ id: f.id, url: f.urlFoto, principal: f.principal }))
    : [];
  const [fotos, setFotos] = useState<PhotoDraft[]>(initialFotos);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof AnimalInput>(k: K, v: AnimalInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const restante = MAX_FOTOS - fotos.length;
    if (restante <= 0) {
      toast.error(`Máximo de ${MAX_FOTOS} fotos por animal. Remova uma foto antes de adicionar outra.`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const arr = Array.from(files).slice(0, restante);
    if (files.length > restante) {
      toast.warning(`Só é possível adicionar mais ${restante} foto(s). Extras foram ignoradas.`);
    }
    setUploading(true);
    try {
      const novos: PhotoDraft[] = [];
      for (const file of arr) {
        const url = await compressImageToDataUrl(file);
        novos.push({ url, principal: false });
      }
      setFotos((prev) => {
        const merged = [...prev, ...novos];
        if (!merged.some((f) => f.principal) && merged.length > 0) merged[0].principal = true;
        return merged;
      });
    } catch (e) {
      toast.error(isQuotaExceeded(e) ? QUOTA_MESSAGE : e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const marcarPrincipal = (idx: number) =>
    setFotos((prev) => prev.map((f, i) => ({ ...f, principal: i === idx })));

  const removerFoto = (idx: number) =>
    setFotos((prev) => {
      const alvo = prev[idx];
      const resto = prev.filter((_, i) => i !== idx);
      if (alvo.principal && resto.length > 0 && !resto.some((f) => f.principal)) {
        resto[0].principal = true;
      }
      return resto;
    });

  const mover = (idx: number, delta: number) =>
    setFotos((prev) => {
      const j = idx + delta;
      if (j < 0 || j >= prev.length) return prev;
      const copy = prev.slice();
      [copy[idx], copy[j]] = [copy[j], copy[idx]];
      return copy;
    });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = animalSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    if (fotos.length === 0 || !fotos.some((f) => f.principal)) {
      toast.error("O animal precisa de pelo menos uma foto principal");
      return;
    }
    setSaving(true);
    try {
      if (mode === "create") {
        const created = createAnimal(
          {
            ...parsed.data,
            organizacaoId: sessao.organizacaoId ?? null,
            acolhedorId: sessao.acolhedorId ?? null,
          },
          fotos.map((f) => ({ url: f.url, principal: f.principal }))
        );
        toast.success("Animal cadastrado com sucesso");
        navigate({ to: "/animais/$animalId", params: { animalId: created.id } });
      } else if (animal) {
        updateAnimal(animal.id, parsed.data);
        replaceFotos(animal.id, fotos.map((f) => ({ url: f.url, principal: f.principal })));
        toast.success("Animal atualizado");
        navigate({ to: "/animais/$animalId", params: { animalId: animal.id } });
      }
    } catch (err) {
      toast.error(isQuotaExceeded(err) ? QUOTA_MESSAGE : err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome" required>
          <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} />
        </Field>
        <Field label="Cor" required>
          <Input value={form.cor} onChange={(e) => set("cor", e.target.value)} />
        </Field>
        <Field label="Espécie" required>
          <Select value={form.especieId} onValueChange={(v) => { set("especieId", v); set("racaId", null); }}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {especies.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Raça">
          <Select
            value={form.racaId ?? "__none"}
            onValueChange={(v) => set("racaId", v === "__none" ? null : v)}
            disabled={!form.especieId}
          >
            <SelectTrigger><SelectValue placeholder={form.especieId ? "SRD / selecione" : "Escolha a espécie"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">SRD / não sei</SelectItem>
              {racas.map((r) => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Porte" required>
          <Select value={form.porte} onValueChange={(v) => set("porte", v as Porte)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(porteLabel) as Porte[]).map((p) => (
                <SelectItem key={p} value={p}>{porteLabel[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Sexo" required>
          <Select value={form.sexo} onValueChange={(v) => set("sexo", v as Sexo)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(sexoLabel) as Sexo[]).map((s) => (
                <SelectItem key={s} value={s}>{sexoLabel[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Idade estimada">
          <Input value={form.idadeEstimada ?? ""} onChange={(e) => set("idadeEstimada", e.target.value)} placeholder="Ex.: 2 anos" />
        </Field>
        <Field label="Status" required>
          <Select value={form.status} onValueChange={(v) => set("status", v as StatusAnimal)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(statusAnimalLabel) as StatusAnimal[]).map((s) => (
                <SelectItem key={s} value={s}>{statusAnimalLabel[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="flex items-center gap-2 md:col-span-2">
          <Checkbox id="castrado" checked={form.castrado} onCheckedChange={(v) => set("castrado", v === true)} />
          <Label htmlFor="castrado">Castrado</Label>
        </div>
        <Field label="Descrição" className="md:col-span-2">
          <Textarea rows={4} value={form.descricao ?? ""} onChange={(e) => set("descricao", e.target.value)} />
        </Field>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <Label>Fotos ({fotos.length}/{MAX_FOTOS} — pelo menos 1 principal)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || fotos.length >= MAX_FOTOS}
            aria-label="Adicionar fotos"
          >
            <Upload className="mr-1 h-4 w-4" />
            {uploading ? "Enviando..." : fotos.length >= MAX_FOTOS ? "Limite atingido" : "Adicionar fotos"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
        {fotos.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Envie ao menos uma foto e marque-a como principal.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {fotos.map((f, i) => (
              <li key={i} className={`relative overflow-hidden rounded-lg border-2 ${f.principal ? "border-primary" : "border-border"}`}>
                <div className="aspect-square">
                  <img src={f.url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                </div>
                {f.principal && (
                  <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">Principal</span>
                )}
                <div className="flex items-center justify-between gap-1 border-t bg-card p-1.5">
                  <div className="flex gap-1">
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label="Mover para cima" disabled={i === 0} onClick={() => mover(i, -1)}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label="Mover para baixo" disabled={i === fotos.length - 1} onClick={() => mover(i, 1)}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" size="icon" variant={f.principal ? "default" : "outline"} className="h-7 w-7" aria-label="Definir como principal" onClick={() => marcarPrincipal(i)}>
                      <Star className={`h-3.5 w-3.5 ${f.principal ? "fill-current" : ""}`} />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" aria-label="Remover foto" onClick={() => removerFoto(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>


      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard/animais" })}>Cancelar</Button>
        <Button type="submit" disabled={saving || fotos.length === 0 || !fotos.some((f) => f.principal)}>
          {saving ? "Salvando..." : mode === "create" ? "Cadastrar animal" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-sm">
        {label}{required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}
