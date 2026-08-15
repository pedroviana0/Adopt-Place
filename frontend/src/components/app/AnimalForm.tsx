import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AnimalPhotoInput } from "@/components/app/AnimalPhotoInput";
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
import { fetchCatalogosGerenciamento } from "@/lib/data/catalogos";
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
import {
  animalPhotoKey,
  MIN_ANIMAL_PHOTOS,
  uploadAnimalPhoto,
  validateAnimalPhoto,
} from "@/lib/data/animal-photo-upload";
import {
  changeAnimalSpecies,
  getBreedsForSpecies,
  validateAnimalTaxonomy,
} from "@/lib/animal-taxonomy";

interface Props {
  animal?: OwnedAnimalDetail;
  mode: "create" | "edit";
}

export function AnimalForm({ animal, mode }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const catalogos = useQuery({
    queryKey: ["catalogos", "management"],
    queryFn: fetchCatalogosGerenciamento,
  });
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [createdAnimalId, setCreatedAnimalId] = useState<string | null>(null);
  // Fotos que ja chegaram ao servidor. Se o envio falhar no meio, uma nova
  // tentativa retoma de onde parou em vez de duplicar o que ja subiu.
  const [uploadedKeys, setUploadedKeys] = useState<string[]>([]);
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
  const racas = getBreedsForSpecies(especies, form.especieId);

  const set = <K extends keyof AnimalInput>(k: K, v: AnimalInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "create" && photos.length < MIN_ANIMAL_PHOTOS) {
      toast.error(
        `Selecione pelo menos ${MIN_ANIMAL_PHOTOS} fotos do animal para poder anunciá-lo.`,
      );
      return;
    }
    for (const file of photos) {
      const photoError = validateAnimalPhoto(file);
      if (photoError) {
        toast.error(`${file.name}: ${photoError}`);
        return;
      }
    }
    // Em edição as fotos já estão no servidor: o que impede o anúncio é o
    // acervo atual do animal, não a seleção deste formulário.
    if (
      mode === "edit" &&
      animal &&
      form.status === StatusAnimal.DISPONIVEL &&
      animal.status !== StatusAnimal.DISPONIVEL &&
      animal.fotos.length < MIN_ANIMAL_PHOTOS
    ) {
      toast.error(
        `Para anunciar, este animal precisa de pelo menos ${MIN_ANIMAL_PHOTOS} fotos. Envie mais fotos na aba Fotos.`,
      );
      return;
    }
    const parsed = animalSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    const taxonomyError = validateAnimalTaxonomy(
      especies,
      parsed.data.especieId,
      parsed.data.racaId,
    );
    if (taxonomyError) {
      toast.error(taxonomyError);
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
        // O animal precisa existir para receber fotos, mas só pode ser
        // anunciado depois delas. Então nasce fora da vitrine e é publicado
        // no fim, quando as fotos já estão lá.
        const wantsPublish = input.status === StatusAnimal.DISPONIVEL;
        const creationInput: AnimalInputDTO = wantsPublish
          ? { ...input, status: StatusAnimal.EM_CUIDADOS }
          : input;

        if (!persistedAnimalId) {
          persistedAnimalId = await criarAnimal(creationInput);
          setCreatedAnimalId(persistedAnimalId);
        } else {
          await atualizarAnimalGerenciado(persistedAnimalId, creationInput);
        }

        const enviadas = new Set(uploadedKeys);
        for (const file of photos) {
          const key = animalPhotoKey(file);
          if (enviadas.has(key)) continue;
          await uploadAnimalPhoto(persistedAnimalId, file);
          enviadas.add(key);
          setUploadedKeys([...enviadas]);
        }

        if (wantsPublish) {
          await atualizarAnimalGerenciado(persistedAnimalId, input);
        }

        await queryClient.invalidateQueries({ queryKey: ["animais-gerenciados"] });
        await queryClient.invalidateQueries({
          queryKey: ["animal-gerenciado", persistedAnimalId],
        });
        toast.success(
          wantsPublish
            ? "Animal cadastrado e anunciado"
            : `Animal cadastrado com ${photos.length} fotos`,
        );
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
          ? `O animal foi salvo, mas o envio das fotos não foi concluído. Tente novamente — as fotos que já subiram não serão duplicadas. ${message}`
          : message,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6" aria-busy={saving}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome" htmlFor="animal-name" required>
          <Input
            id="animal-name"
            required
            maxLength={80}
            value={form.nome}
            onChange={(e) => set("nome", e.target.value)}
          />
        </Field>
        <Field label="Cor" htmlFor="animal-color" required>
          <Input
            id="animal-color"
            required
            maxLength={80}
            value={form.cor}
            onChange={(e) => set("cor", e.target.value)}
          />
        </Field>
        <Field label="Espécie" htmlFor="animal-species" required>
          <Select
            value={form.especieId}
            onValueChange={(v) => {
              setForm((current) => ({
                ...current,
                ...changeAnimalSpecies(current, v),
              }));
            }}
            disabled={catalogos.isPending || catalogos.isError}
          >
            <SelectTrigger id="animal-species">
              <SelectValue
                placeholder={
                  catalogos.isPending
                    ? "Carregando espécies..."
                    : catalogos.isError
                      ? "Catálogo indisponível"
                      : "Selecione a espécie"
                }
              />
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
        <Field label="Raça" htmlFor="animal-breed">
          <Select
            value={form.racaId ?? undefined}
            onValueChange={(v) => set("racaId", v)}
            disabled={!form.especieId || catalogos.isPending || catalogos.isError}
          >
            <SelectTrigger id="animal-breed">
              <SelectValue
                placeholder={form.especieId ? "Selecione a raça" : "Escolha a espécie"}
              />
            </SelectTrigger>
            <SelectContent>
              {racas.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Porte" htmlFor="animal-size" required>
          <Select value={form.porte} onValueChange={(v) => set("porte", v as Porte)}>
            <SelectTrigger id="animal-size">
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
        <Field label="Sexo" htmlFor="animal-sex" required>
          <Select value={form.sexo} onValueChange={(v) => set("sexo", v as Sexo)}>
            <SelectTrigger id="animal-sex">
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
        <Field label="Idade estimada" htmlFor="animal-age">
          <Input
            id="animal-age"
            maxLength={50}
            value={form.idadeEstimada ?? ""}
            onChange={(e) => set("idadeEstimada", e.target.value)}
            placeholder="Ex.: 2 anos"
          />
        </Field>
        <Field label="Status" htmlFor="animal-status" required>
          <Select value={form.status} onValueChange={(v) => set("status", v as StatusAnimal)}>
            <SelectTrigger id="animal-status">
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
        <Field label="Descrição" htmlFor="animal-description" className="md:col-span-2">
          <Textarea
            id="animal-description"
            rows={4}
            maxLength={2000}
            value={form.descricao ?? ""}
            onChange={(e) => set("descricao", e.target.value)}
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">{form.descricao?.length ?? 0}/2000</p>
        </Field>
        {mode === "create" && (
          <Field
            label={`Fotos (mínimo ${MIN_ANIMAL_PHOTOS})`}
            required
            className="md:col-span-2"
          >
            <AnimalPhotoInput
              files={photos}
              onChange={setPhotos}
              minFiles={MIN_ANIMAL_PHOTOS}
              disabled={saving}
            />
          </Field>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
              ? "Salvando e enviando fotos..."
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
  htmlFor,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mb-1.5 block text-sm">
        {label}
        {required && (
          <span aria-hidden="true" className="text-destructive">
            {" "}
            *
          </span>
        )}
      </Label>
      {children}
    </div>
  );
}
