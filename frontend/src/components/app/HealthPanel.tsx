import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2, Plus } from "lucide-react";
import {
  fetchRegistrosSaude,
  criarRegistroSaude,
  excluirRegistroSaude,
  type NovoRegistroSaude,
} from "@/lib/data/saude";
import { ResultadoTeste } from "@/lib/domain/enums";

interface Props {
  animalId: string;
}

// The date input yields "YYYY-MM-DD"; the contract expects ISO datetime + offset.
function toIso(date: string): string {
  return new Date(date).toISOString();
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function HealthPanel({ animalId }: Props) {
  const queryClient = useQueryClient();
  const registrosQuery = useQuery({
    queryKey: ["registros-saude", animalId],
    queryFn: () => fetchRegistrosSaude(animalId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["registros-saude", animalId] });

  if (registrosQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }
  if (registrosQuery.isError) {
    return (
      <p className="text-sm text-destructive">
        {registrosQuery.error instanceof Error
          ? registrosQuery.error.message
          : "Não foi possível carregar os registros."}
      </p>
    );
  }

  const registros = registrosQuery.data ?? [];
  const vacinas = registros.filter((r) => r.tipoRegistro === "VACINA");
  const parasitas = registros.filter((r) => r.tipoRegistro === "CONTROLE_PARASITAS");
  const testes = registros.filter((r) => r.tipoRegistro === "TESTE_DOENCA");

  return (
    <div>
      <h2 className="font-serif text-xl font-semibold">Saúde</h2>
      <p className="text-sm text-muted-foreground">Registros clínicos do animal.</p>
      <Tabs defaultValue="vacinas" className="mt-4">
        <TabsList>
          <TabsTrigger value="vacinas">Vacinas ({vacinas.length})</TabsTrigger>
          <TabsTrigger value="parasitas">Parasitas ({parasitas.length})</TabsTrigger>
          <TabsTrigger value="testes">Testes ({testes.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="vacinas" className="mt-4 space-y-4">
          <VacinaForm animalId={animalId} onSaved={invalidate} />
          <RegistroList
            animalId={animalId}
            onDeleted={invalidate}
            items={vacinas.map((r) => ({
              id: r.id,
              titulo: r.nomeVacina ?? "—",
              subtitulo: `Aplicada em ${fmt(r.dataAplicacao)}${r.dataProxima ? " · próxima em " + fmt(r.dataProxima) : ""}`,
              extra: `Responsável: ${r.responsavelRegistro}`,
            }))}
          />
        </TabsContent>
        <TabsContent value="parasitas" className="mt-4 space-y-4">
          <ParasitaForm animalId={animalId} onSaved={invalidate} />
          <RegistroList
            animalId={animalId}
            onDeleted={invalidate}
            items={parasitas.map((r) => ({
              id: r.id,
              titulo: r.tipoMedicamento ?? "—",
              subtitulo: `Aplicada em ${fmt(r.dataAplicacao)}${r.dataProxima ? " · próxima em " + fmt(r.dataProxima) : ""}`,
              extra: `${r.frequencia ?? ""} · Responsável: ${r.responsavelRegistro}`.trim(),
            }))}
          />
        </TabsContent>
        <TabsContent value="testes" className="mt-4 space-y-4">
          <TesteForm animalId={animalId} onSaved={invalidate} />
          <RegistroList
            animalId={animalId}
            onDeleted={invalidate}
            items={testes.map((r) => ({
              id: r.id,
              titulo: r.nomeDoenca ?? "—",
              subtitulo: `Testado em ${fmt(r.dataAplicacao)} · Resultado: ${r.resultado ?? "—"}`,
              extra: `Responsável: ${r.responsavelRegistro}`,
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RegistroList({
  animalId,
  items,
  onDeleted,
}: {
  animalId: string;
  items: { id: string; titulo: string; subtitulo: string; extra?: string }[];
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState<string | null>(null);
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Nenhum registro.</p>;
  const onDelete = async (id: string) => {
    if (!confirm("Excluir este registro?")) return;
    setDeleting(id);
    try {
      await excluirRegistroSaude(animalId, id);
      onDeleted();
      toast.success("Registro excluído");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setDeleting(null);
    }
  };
  return (
    <ul className="divide-y rounded-xl border bg-card">
      {items.map((it) => (
        <li key={it.id} className="flex items-start justify-between gap-3 p-3">
          <div className="min-w-0">
            <p className="font-medium">{it.titulo}</p>
            <p className="text-xs text-muted-foreground">{it.subtitulo}</p>
            {it.extra && <p className="text-xs text-muted-foreground">{it.extra}</p>}
          </div>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Excluir registro"
            disabled={deleting === it.id}
            onClick={() => onDelete(it.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}

function useBaseState() {
  const hoje = new Date().toISOString().slice(0, 10);
  const [dataAplicacao, setDataAplicacao] = useState(hoje);
  const [dataProxima, setDataProxima] = useState("");
  const [saving, setSaving] = useState(false);
  const reset = () => {
    setDataAplicacao(hoje);
    setDataProxima("");
  };
  return { dataAplicacao, setDataAplicacao, dataProxima, setDataProxima, saving, setSaving, reset };
}

function VacinaForm({ animalId, onSaved }: { animalId: string; onSaved: () => void }) {
  const base = useBaseState();
  const [nome, setNome] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Informe o nome da vacina");
      return;
    }
    const input: NovoRegistroSaude = {
      tipoRegistro: "VACINA",
      nomeCustom: nome.trim(),
      dataAplicacao: toIso(base.dataAplicacao),
      ...(base.dataProxima ? { dataProximaDose: toIso(base.dataProxima) } : {}),
    };
    base.setSaving(true);
    try {
      await criarRegistroSaude(animalId, input);
      onSaved();
      toast.success("Vacina registrada");
      base.reset();
      setNome("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      base.setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border bg-muted/30 p-4">
      <p className="mb-3 text-sm font-medium">Nova vacina</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="v-nome" className="mb-1 block text-xs">
            Vacina
          </Label>
          <Input
            id="v-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: V10"
          />
        </div>
        <DateFields base={base} prefix="v" nextLabel="Próxima dose (opcional)" />
      </div>
      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" disabled={base.saving}>
          <Plus className="mr-1 h-4 w-4" />
          {base.saving ? "Salvando..." : "Adicionar"}
        </Button>
      </div>
    </form>
  );
}

function ParasitaForm({ animalId, onSaved }: { animalId: string; onSaved: () => void }) {
  const base = useBaseState();
  const [medicamento, setMedicamento] = useState("");
  const [frequencia, setFrequencia] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicamento.trim()) {
      toast.error("Informe o tipo de medicamento");
      return;
    }
    if (!frequencia.trim()) {
      toast.error("Informe a frequência");
      return;
    }
    const input: NovoRegistroSaude = {
      tipoRegistro: "CONTROLE_PARASITAS",
      tipoMedicacao: medicamento.trim(),
      frequencia: frequencia.trim(),
      dataAplicacao: toIso(base.dataAplicacao),
      ...(base.dataProxima ? { dataProxima: toIso(base.dataProxima) } : {}),
    };
    base.setSaving(true);
    try {
      await criarRegistroSaude(animalId, input);
      onSaved();
      toast.success("Controle de parasitas registrado");
      base.reset();
      setMedicamento("");
      setFrequencia("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      base.setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border bg-muted/30 p-4">
      <p className="mb-3 text-sm font-medium">Novo controle de parasitas</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="p-med" className="mb-1 block text-xs">
            Tipo de medicamento
          </Label>
          <Input
            id="p-med"
            value={medicamento}
            onChange={(e) => setMedicamento(e.target.value)}
            placeholder="Ex.: Bravecto"
          />
        </div>
        <div>
          <Label htmlFor="p-freq" className="mb-1 block text-xs">
            Frequência
          </Label>
          <Input
            id="p-freq"
            value={frequencia}
            onChange={(e) => setFrequencia(e.target.value)}
            placeholder="Ex.: A cada 3 meses"
          />
        </div>
        <DateFields base={base} prefix="p" nextLabel="Próxima data (opcional)" />
      </div>
      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" disabled={base.saving}>
          <Plus className="mr-1 h-4 w-4" />
          {base.saving ? "Salvando..." : "Adicionar"}
        </Button>
      </div>
    </form>
  );
}

function TesteForm({ animalId, onSaved }: { animalId: string; onSaved: () => void }) {
  const base = useBaseState();
  const [nome, setNome] = useState("");
  const [resultado, setResultado] = useState<ResultadoTeste | "">("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Informe o nome da doença");
      return;
    }
    if (resultado !== "POSITIVO" && resultado !== "NEGATIVO") {
      toast.error("Selecione o resultado");
      return;
    }
    const input: NovoRegistroSaude = {
      tipoRegistro: "TESTE_DOENCA",
      nomeCustom: nome.trim(),
      resultado,
      dataAplicacao: toIso(base.dataAplicacao),
      ...(base.dataProxima ? { dataProxima: toIso(base.dataProxima) } : {}),
    };
    base.setSaving(true);
    try {
      await criarRegistroSaude(animalId, input);
      onSaved();
      toast.success("Teste registrado");
      base.reset();
      setNome("");
      setResultado("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      base.setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border bg-muted/30 p-4">
      <p className="mb-3 text-sm font-medium">Novo teste de doença</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="t-nome" className="mb-1 block text-xs">
            Doença testada
          </Label>
          <Input
            id="t-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: FIV/FeLV"
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="mb-1 block text-xs">Resultado</Label>
          <RadioGroup
            value={resultado}
            onValueChange={(v) => setResultado(v as ResultadoTeste)}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value={ResultadoTeste.POSITIVO} id="t-pos" />
              <Label htmlFor="t-pos">Positivo</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value={ResultadoTeste.NEGATIVO} id="t-neg" />
              <Label htmlFor="t-neg">Negativo</Label>
            </div>
          </RadioGroup>
        </div>
        <DateFields base={base} prefix="t" nextLabel="Próxima data (opcional)" />
      </div>
      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" disabled={base.saving}>
          <Plus className="mr-1 h-4 w-4" />
          {base.saving ? "Salvando..." : "Adicionar"}
        </Button>
      </div>
    </form>
  );
}

function DateFields({
  base,
  prefix,
  nextLabel,
}: {
  base: ReturnType<typeof useBaseState>;
  prefix: string;
  nextLabel: string;
}) {
  return (
    <>
      <div>
        <Label htmlFor={`${prefix}-data`} className="mb-1 block text-xs">
          Data do registro
        </Label>
        <Input
          id={`${prefix}-data`}
          type="date"
          value={base.dataAplicacao}
          onChange={(e) => base.setDataAplicacao(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-prox`} className="mb-1 block text-xs">
          {nextLabel}
        </Label>
        <Input
          id={`${prefix}-prox`}
          type="date"
          value={base.dataProxima}
          onChange={(e) => base.setDataProxima(e.target.value)}
        />
      </div>
    </>
  );
}
