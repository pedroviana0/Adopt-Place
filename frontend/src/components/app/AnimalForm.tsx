import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { animalSchema, type AnimalInput } from "@/lib/schemas/animal";
import { fetchCatalogos } from "@/lib/data/catalogos";
import {
  Porte,
  Sexo,
  StatusAnimal,
  porteLabel,
  sexoLabel,
  statusAnimalLabel,
} from "@/lib/domain/enums";
import {
  criarAnimal,
  atualizarAnimalGerenciado,
  type AnimalInputDTO,
  type OwnedAnimalDetail,
} from "@/lib/data/animais";
import { completeAnimalPrimaryPhoto, validateAnimalPhoto } from "@/lib/data/animal-photo-upload";

interface Props {
  animal?: OwnedAnimalDetail;
  mode: "create" | "edit";
}

export function AnimalForm({ animal, mode }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const catalogos = useQuery({ queryKey: ["catalogos"], queryFn: fetchCatalogos });
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [createdAnimalId, setCreatedAnimalId] = useState<string | null>(null);
  const [form, setForm] = useState<AnimalInput>({
    nome: animal?.nome ?? "",
    especieId: animal?.especie.id ?? "",
    racaId: animal?.raca?.id ?? null,
    porte: (animal?.porte as Porte) ?? Porte.M,
    sexo: (animal?.sexo as Sexo) ?? Sexo.M,
    cor: animal?.cor ?? "",
    idadeEstimada: animal?.idadeEstimada ?? "",
    castrado: animal?.castrado ?? false,
    descricao: animal?.descricao ?? "",
    status: animal?.status ?? StatusAnimal.EM_CUIDADOS,
  });

  const especies = catalogos.data?.especies ?? [];
  const racas = especies.find((e) => e.id === form.especieId)?.racas ?? [];

  const set = <K extends keyof AnimalInput>(k: K, v: AnimalInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "create" && !photo) {
      toast.error("Selecione uma foto do animal.");
      return;
    }
    if (photo) {
      const photoError = validateAnimalPhoto(photo);
      if (photoError) {
        toast.error(photoError);
        return;
      }
    }
    const parsed = animalSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    // Contract expects strings (empty → treated as unset), never null, for the
    // optional text fields; racaId is nullable.
    const input: AnimalInputDTO = {
      nome: parsed.data.nome,
      especieId: parsed.data.especieId,
      racaId: parsed.data.racaId ?? null,
      porte: parsed.data.porte,
      sexo: parsed.data.sexo,
      cor: parsed.data.cor,
      idadeEstimada: parsed.data.idadeEstimada ?? "",
      castrado: parsed.data.castrado,
      descricao: parsed.data.descricao ?? "",
      status: parsed.data.status,
    };
    let persistedAnimalId = createdAnimalId;
    setSaving(true);
    try {
      if (mode === "create") {
        if (!persistedAnimalId) {
          persistedAnimalId = await criarAnimal(input);
          setCreatedAnimalId(persistedAnimalId);
        } else {
          await atualizarAnimalGerenciado(persistedAnimalId, input);
        }
        await completeAnimalPrimaryPhoto(persistedAnimalId, photo!);
        await queryClient.invalidateQueries({ queryKey: ["animais-gerenciados"] });
        await queryClient.invalidateQueries({
          queryKey: ["animal-gerenciado", persistedAnimalId],
        });
        toast.success("Animal cadastrado com foto");
        navigate({
          to: "/dashboard/animais/$animalId",
          params: { animalId: persistedAnimalId },
        });
      } else if (animal) {
        await atualizarAnimalGerenciado(animal.id, input);
        await queryClient.invalidateQueries({ queryKey: ["animal-gerenciado", animal.id] });
        await queryClient.invalidateQueries({ queryKey: ["animais-gerenciados"] });
        toast.success("Animal atualizado");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar";
      toast.error(
        mode === "create" && persistedAnimalId
          ? `O animal foi salvo, mas a foto nao foi concluida. Tente novamente. ${message}`
          : message,
      );
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
          <Select
            value={form.especieId}
            onValueChange={(v) => {
              set("especieId", v);
              set("racaId", null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {especies.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Raça">
          <Select
            value={form.racaId ?? "__none"}
            onValueChange={(v) => set("racaId", v === "__none" ? null : v)}
            disabled={!form.especieId}
          >
            <SelectTrigger>
              <SelectValue placeholder={form.especieId ? "SRD / selecione" : "Escolha a espécie"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">SRD / não sei</SelectItem>
              {racas.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Porte" required>
          <Select value={form.porte} onValueChange={(v) => set("porte", v as Porte)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(porteLabel) as Porte[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {porteLabel[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Sexo" required>
          <Select value={form.sexo} onValueChange={(v) => set("sexo", v as Sexo)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(sexoLabel) as Sexo[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {sexoLabel[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Idade estimada">
          <Input
            value={form.idadeEstimada ?? ""}
            onChange={(e) => set("idadeEstimada", e.target.value)}
            placeholder="Ex.: 2 anos"
          />
        </Field>
        <Field label="Status" required>
          <Select value={form.status} onValueChange={(v) => set("status", v as StatusAnimal)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(statusAnimalLabel) as StatusAnimal[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {statusAnimalLabel[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="flex items-center gap-2 md:col-span-2">
          <Checkbox
            id="castrado"
            checked={form.castrado}
            onCheckedChange={(v) => set("castrado", v === true)}
          />
          <Label htmlFor="castrado">Castrado</Label>
        </div>
        <Field label="Descrição" className="md:col-span-2">
          <Textarea
            rows={4}
            value={form.descricao ?? ""}
            onChange={(e) => set("descricao", e.target.value)}
          />
        </Field>
        {mode === "create" && (
          <Field label="Foto principal" required className="md:col-span-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            />
          </Field>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: "/dashboard/animais" })}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving
            ? mode === "create"
              ? "Salvando e enviando foto..."
              : "Salvando..."
            : mode === "create"
              ? "Cadastrar animal"
              : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-sm">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}
