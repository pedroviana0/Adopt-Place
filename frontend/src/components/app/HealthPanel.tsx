import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2, Plus } from "lucide-react";
import { useDbVersion } from "@/lib/data/hooks";
import { listRegistros, createRegistro, deleteRegistro } from "@/lib/data/saude";
import { listVacinas, listDoencas } from "@/lib/data/catalogos";
import { registroSaudeSchema } from "@/lib/schemas/registroSaude";
import { ResultadoTeste, TipoRegistroSaude } from "@/lib/domain/enums";

interface Props { animalId: string }

const OUTRA = "__outra__";

export function HealthPanel({ animalId }: Props) {
  useDbVersion();
  const registros = listRegistros(animalId);
  const vacinas = registros.filter((r) => r.tipo === "VACINA");
  const parasitas = registros.filter((r) => r.tipo === "CONTROLE_PARASITAS");
  const testes = registros.filter((r) => r.tipo === "TESTE_DOENCA");

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
          <VacinaForm animalId={animalId} />
          <RegistroList
            items={vacinas.map((r) => ({
              id: r.id,
              titulo: r.nomeVacina ?? "—",
              subtitulo: `Aplicada em ${fmt(r.dataRegistro)}${r.dataProxima ? " · próxima em " + fmt(r.dataProxima) : ""}`,
              extra: `Responsável: ${r.responsavelRegistro}`,
            }))}
          />
        </TabsContent>
        <TabsContent value="parasitas" className="mt-4 space-y-4">
          <ParasitaForm animalId={animalId} />
          <RegistroList
            items={parasitas.map((r) => ({
              id: r.id,
              titulo: r.tipoMedicamento ?? "—",
              subtitulo: `Aplicada em ${fmt(r.dataRegistro)}${r.dataProxima ? " · próxima em " + fmt(r.dataProxima) : ""}`,
              extra: `${r.frequencia ?? ""} · Responsável: ${r.responsavelRegistro}`.trim(),
            }))}
          />
        </TabsContent>
        <TabsContent value="testes" className="mt-4 space-y-4">
          <TesteForm animalId={animalId} />
          <RegistroList
            items={testes.map((r) => ({
              id: r.id,
              titulo: r.nomeDoenca ?? "—",
              subtitulo: `Testado em ${fmt(r.dataRegistro)} · Resultado: ${r.resultado ?? "—"}`,
              extra: `Responsável: ${r.responsavelRegistro}`,
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function RegistroList({ items }: { items: { id: string; titulo: string; subtitulo: string; extra?: string }[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Nenhum registro.</p>;
  const onDelete = (id: string) => {
    if (!confirm("Excluir este registro?")) return;
    try { deleteRegistro(id); toast.success("Registro excluído"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
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
          <Button size="icon" variant="ghost" aria-label="Excluir registro" onClick={() => onDelete(it.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}

function useBaseState() {
  const hoje = new Date().toISOString().slice(0, 10);
  const [dataRegistro, setDataRegistro] = useState(hoje);
  const [dataProxima, setDataProxima] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [saving, setSaving] = useState(false);
  const reset = () => { setDataRegistro(hoje); setDataProxima(""); setResponsavel(""); };
  return { dataRegistro, setDataRegistro, dataProxima, setDataProxima, responsavel, setResponsavel, saving, setSaving, reset };
}

function VacinaForm({ animalId }: { animalId: string }) {
  const base = useBaseState();
  const [vacinaSel, setVacinaSel] = useState("");
  const [vacinaCustom, setVacinaCustom] = useState("");
  const catalogo = listVacinas();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const custom = vacinaSel === OUTRA;
    const nomeVacina = custom ? vacinaCustom.trim() : catalogo.find((v) => v.id === vacinaSel)?.nome ?? "";
    const parsed = registroSaudeSchema.safeParse({
      tipo: TipoRegistroSaude.VACINA,
      nomeVacina,
      ehVacinaCustomizada: custom,
      dataRegistro: base.dataRegistro,
      dataProxima: base.dataProxima || null,
      responsavelRegistro: base.responsavel,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos"); return; }
    base.setSaving(true);
    try {
      createRegistro({ ...parsed.data, animalId });
      toast.success("Vacina registrada");
      base.reset(); setVacinaSel(""); setVacinaCustom("");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { base.setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border bg-muted/30 p-4">
      <p className="mb-3 text-sm font-medium">Nova vacina</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="v-nome" className="mb-1 block text-xs">Vacina</Label>
          <Select value={vacinaSel} onValueChange={setVacinaSel}>
            <SelectTrigger id="v-nome"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {catalogo.map((v) => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}
              <SelectItem value={OUTRA}>Outra…</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {vacinaSel === OUTRA && (
          <div>
            <Label htmlFor="v-cust" className="mb-1 block text-xs">Nome da vacina</Label>
            <Input id="v-cust" value={vacinaCustom} onChange={(e) => setVacinaCustom(e.target.value)} />
          </div>
        )}
        <BaseFields base={base} prefix="v" />
      </div>
      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" disabled={base.saving}><Plus className="mr-1 h-4 w-4" />{base.saving ? "Salvando..." : "Adicionar"}</Button>
      </div>
    </form>
  );
}

function ParasitaForm({ animalId }: { animalId: string }) {
  const base = useBaseState();
  const [medicamento, setMedicamento] = useState("");
  const [frequencia, setFrequencia] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = registroSaudeSchema.safeParse({
      tipo: TipoRegistroSaude.CONTROLE_PARASITAS,
      tipoMedicamento: medicamento,
      frequencia: frequencia || null,
      dataRegistro: base.dataRegistro,
      dataProxima: base.dataProxima || null,
      responsavelRegistro: base.responsavel,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos"); return; }
    base.setSaving(true);
    try {
      createRegistro({ ...parsed.data, animalId });
      toast.success("Controle de parasitas registrado");
      base.reset(); setMedicamento(""); setFrequencia("");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { base.setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border bg-muted/30 p-4">
      <p className="mb-3 text-sm font-medium">Novo controle de parasitas</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="p-med" className="mb-1 block text-xs">Tipo de medicamento</Label>
          <Input id="p-med" value={medicamento} onChange={(e) => setMedicamento(e.target.value)} placeholder="Ex.: Bravecto" />
        </div>
        <div>
          <Label htmlFor="p-freq" className="mb-1 block text-xs">Frequência (opcional)</Label>
          <Input id="p-freq" value={frequencia} onChange={(e) => setFrequencia(e.target.value)} placeholder="Ex.: A cada 3 meses" />
        </div>
        <BaseFields base={base} prefix="p" />
      </div>
      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" disabled={base.saving}><Plus className="mr-1 h-4 w-4" />{base.saving ? "Salvando..." : "Adicionar"}</Button>
      </div>
    </form>
  );
}

function TesteForm({ animalId }: { animalId: string }) {
  const base = useBaseState();
  const [doencaSel, setDoencaSel] = useState("");
  const [doencaCustom, setDoencaCustom] = useState("");
  const [resultado, setResultado] = useState<ResultadoTeste | "">("");
  const catalogo = listDoencas();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const custom = doencaSel === OUTRA;
    const nomeDoenca = custom ? doencaCustom.trim() : catalogo.find((d) => d.id === doencaSel)?.nome ?? "";
    const parsed = registroSaudeSchema.safeParse({
      tipo: TipoRegistroSaude.TESTE_DOENCA,
      nomeDoenca,
      ehDoencaCustomizada: custom,
      resultado: resultado || undefined,
      dataRegistro: base.dataRegistro,
      dataProxima: base.dataProxima || null,
      responsavelRegistro: base.responsavel,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos"); return; }
    base.setSaving(true);
    try {
      createRegistro({ ...parsed.data, animalId });
      toast.success("Teste registrado");
      base.reset(); setDoencaSel(""); setDoencaCustom(""); setResultado("");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { base.setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border bg-muted/30 p-4">
      <p className="mb-3 text-sm font-medium">Novo teste de doença</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="t-doenca" className="mb-1 block text-xs">Doença testada</Label>
          <Select value={doencaSel} onValueChange={setDoencaSel}>
            <SelectTrigger id="t-doenca"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {catalogo.map((d) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}
              <SelectItem value={OUTRA}>Outra…</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {doencaSel === OUTRA && (
          <div>
            <Label htmlFor="t-cust" className="mb-1 block text-xs">Nome da doença</Label>
            <Input id="t-cust" value={doencaCustom} onChange={(e) => setDoencaCustom(e.target.value)} />
          </div>
        )}
        <div className="sm:col-span-2">
          <Label className="mb-1 block text-xs">Resultado</Label>
          <RadioGroup value={resultado} onValueChange={(v) => setResultado(v as ResultadoTeste)} className="flex gap-4">
            <div className="flex items-center gap-2"><RadioGroupItem value={ResultadoTeste.POSITIVO} id="t-pos" /><Label htmlFor="t-pos">Positivo</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value={ResultadoTeste.NEGATIVO} id="t-neg" /><Label htmlFor="t-neg">Negativo</Label></div>
          </RadioGroup>
        </div>
        <BaseFields base={base} prefix="t" />
      </div>
      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" disabled={base.saving}><Plus className="mr-1 h-4 w-4" />{base.saving ? "Salvando..." : "Adicionar"}</Button>
      </div>
    </form>
  );
}

function BaseFields({ base, prefix }: { base: ReturnType<typeof useBaseState>; prefix: string }) {
  return (
    <>
      <div>
        <Label htmlFor={`${prefix}-data`} className="mb-1 block text-xs">Data do registro</Label>
        <Input id={`${prefix}-data`} type="date" value={base.dataRegistro} onChange={(e) => base.setDataRegistro(e.target.value)} />
      </div>
      <div>
        <Label htmlFor={`${prefix}-prox`} className="mb-1 block text-xs">Próxima data (opcional)</Label>
        <Input id={`${prefix}-prox`} type="date" value={base.dataProxima} onChange={(e) => base.setDataProxima(e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${prefix}-resp`} className="mb-1 block text-xs">Responsável pelo registro</Label>
        <Input id={`${prefix}-resp`} value={base.responsavel} onChange={(e) => base.setResponsavel(e.target.value)} placeholder="Ex.: Dr. Carlos" />
      </div>
    </>
  );
}
