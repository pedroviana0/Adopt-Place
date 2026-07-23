import { useMemo } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { listEspecies, listRacas } from "@/lib/data/catalogos";
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

export function AnimalFilters({
  value,
  onChange,
}: {
  value: FilterState;
  onChange: (v: FilterState) => void;
}) {
  const especies = listEspecies();
  const racas = useMemo(() => listRacas(value.especieId), [value.especieId]);

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

  return (
    <div className="rounded-2xl border bg-card p-4 md:p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <Label className="mb-1 block text-xs">Espécie</Label>
          <Select
            value={value.especieId ?? "__all"}
            onValueChange={(v) => onChange({ ...value, especieId: v === "__all" ? undefined : v, racaId: undefined })}
          >
            <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas</SelectItem>
              {especies.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1 block text-xs">Raça</Label>
          <Select
            value={value.racaId ?? "__all"}
            onValueChange={(v) => onChange({ ...value, racaId: v === "__all" ? undefined : v })}
            disabled={!value.especieId}
          >
            <SelectTrigger><SelectValue placeholder={value.especieId ? "Todas" : "Selecione uma espécie"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas</SelectItem>
              {racas.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1 block text-xs">Porte</Label>
          <Select value={value.porte ?? "__all"} onValueChange={(v) => onChange({ ...value, porte: v === "__all" ? undefined : v })}>
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos</SelectItem>
              <SelectItem value="P">{porteLabel.P}</SelectItem>
              <SelectItem value="M">{porteLabel.M}</SelectItem>
              <SelectItem value="G">{porteLabel.G}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1 block text-xs">Sexo</Label>
          <Select value={value.sexo ?? "__all"} onValueChange={(v) => onChange({ ...value, sexo: v === "__all" ? undefined : v })}>
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos</SelectItem>
              <SelectItem value="M">{sexoLabel.M}</SelectItem>
              <SelectItem value="F">{sexoLabel.F}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1 block text-xs">Cidade</Label>
          <Input
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
            size="sm"
            className="h-7 rounded-full text-xs"
            onClick={() => toggleTag(t)}
          >
            {t}
          </Button>
        ))}
        {hasAny && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-7 gap-1 text-xs"
            onClick={() => onChange(emptyFilters())}
          >
            <X className="h-3 w-3" /> Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
