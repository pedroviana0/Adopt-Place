import { useId, useMemo } from "react";
import { AlertCircle, LoaderCircle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { porteLabel, sexoLabel } from "@/lib/domain/enums";

export interface FilterState {
  especieId?: string;
  racaId?: string;
  porte?: string;
  sexo?: string;
  cidade?: string;
  tags: string[];
}

export function emptyFilters(): FilterState {
  return { tags: [] };
}

const TAG_OPTS = ["Castrado", "Vacinado", "Vermifugado", "Testado"];

interface CatalogEspecie {
  id: string;
  nome: string;
  racas: { id: string; nome: string; especieId: string }[];
}

const EMPTY_ESPECIES: CatalogEspecie[] = [];

export function AnimalFilters({
  value,
  onChange,
  especies: especiesProp,
  isCatalogLoading = false,
  isCatalogError = false,
  onRetryCatalog,
}: {
  value: FilterState;
  onChange: (v: FilterState) => void;
  // The public showcase supplies the real catalog from GET /api/catalogos.
  especies?: CatalogEspecie[];
  isCatalogLoading?: boolean;
  isCatalogError?: boolean;
  onRetryCatalog?: () => void;
}) {
  const id = useId();
  const especies = especiesProp ?? EMPTY_ESPECIES;
  const racas = useMemo(() => {
    return especies.find((e) => e.id === value.especieId)?.racas ?? [];
  }, [especies, value.especieId]);

  const toggleTag = (t: string) => {
    onChange({
      ...value,
      tags: value.tags.includes(t) ? value.tags.filter((x) => x !== t) : [...value.tags, t],
    });
  };

  const hasAny =
    value.especieId ||
    value.racaId ||
    value.porte ||
    value.sexo ||
    value.cidade ||
    value.tags.length > 0;
  const activeCount =
    [value.especieId, value.racaId, value.porte, value.sexo, value.cidade].filter(Boolean).length +
    value.tags.length;

  return (
    <section aria-label="Filtros de animais" className="rounded-xl border bg-card p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Filtrar animais</h3>
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {activeCount === 0
              ? "Nenhum filtro ativo"
              : `${activeCount} ${activeCount === 1 ? "filtro ativo" : "filtros ativos"}`}
          </p>
        </div>
        {hasAny && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            onClick={() => onChange(emptyFilters())}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" /> Limpar filtros
          </Button>
        )}
      </div>

      {isCatalogLoading && (
        <p role="status" className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Carregando espécies e raças…
        </p>
      )}
      {isCatalogError && (
        <div
          role="alert"
          className="mb-3 flex flex-wrap items-center gap-2 text-xs text-destructive"
        >
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Espécies e raças estão temporariamente indisponíveis.</span>
          {onRetryCatalog && (
            <Button type="button" variant="outline" size="sm" onClick={onRetryCatalog}>
              Tentar novamente
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <Label htmlFor={`${id}-especie`} className="mb-1 block text-xs">
            Espécie
          </Label>
          <Select
            value={value.especieId ?? "__all"}
            onValueChange={(v) =>
              onChange({ ...value, especieId: v === "__all" ? undefined : v, racaId: undefined })
            }
            disabled={isCatalogLoading || isCatalogError}
          >
            <SelectTrigger id={`${id}-especie`}>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas</SelectItem>
              {especies.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`${id}-raca`} className="mb-1 block text-xs">
            Raça
          </Label>
          <Select
            value={value.racaId ?? "__all"}
            onValueChange={(v) => onChange({ ...value, racaId: v === "__all" ? undefined : v })}
            disabled={!value.especieId || isCatalogLoading || isCatalogError}
          >
            <SelectTrigger id={`${id}-raca`}>
              <SelectValue placeholder={value.especieId ? "Todas" : "Selecione uma espécie"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas</SelectItem>
              {racas.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`${id}-porte`} className="mb-1 block text-xs">
            Porte
          </Label>
          <Select
            value={value.porte ?? "__all"}
            onValueChange={(v) => onChange({ ...value, porte: v === "__all" ? undefined : v })}
          >
            <SelectTrigger id={`${id}-porte`}>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos</SelectItem>
              <SelectItem value="P">{porteLabel.P}</SelectItem>
              <SelectItem value="M">{porteLabel.M}</SelectItem>
              <SelectItem value="G">{porteLabel.G}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`${id}-sexo`} className="mb-1 block text-xs">
            Sexo
          </Label>
          <Select
            value={value.sexo ?? "__all"}
            onValueChange={(v) => onChange({ ...value, sexo: v === "__all" ? undefined : v })}
          >
            <SelectTrigger id={`${id}-sexo`}>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos</SelectItem>
              <SelectItem value="M">{sexoLabel.M}</SelectItem>
              <SelectItem value="F">{sexoLabel.F}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`${id}-cidade`} className="mb-1 block text-xs">
            Cidade
          </Label>
          <Input
            id={`${id}-cidade`}
            placeholder="Ex.: Volta Redonda"
            value={value.cidade ?? ""}
            onChange={(e) => onChange({ ...value, cidade: e.target.value || undefined })}
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Outros:</span>
        {TAG_OPTS.map((t) => (
          <Button
            key={t}
            type="button"
            variant={value.tags.includes(t) ? "default" : "outline"}
            aria-pressed={value.tags.includes(t)}
            size="sm"
            className="h-7 rounded-full text-xs"
            onClick={() => toggleTag(t)}
          >
            {t}
          </Button>
        ))}
      </div>
    </section>
  );
}
