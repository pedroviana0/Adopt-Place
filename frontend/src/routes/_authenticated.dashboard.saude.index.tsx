import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  fetchHealthOverview,
  fetchHealthAgenda,
  registrarConsulta,
  reagendarCuidado,
  cancelarCuidado,
  concluirCuidado,
  type HealthAgendaItem,
  type AgendaSituacaoFilter,
  type ConclusaoCuidado,
} from "@/lib/data/cuidados";
import { fetchAnimaisGerenciados } from "@/lib/data/animais";
import { tipoCuidadoPlanejadoLabel } from "@/lib/domain/enums";
import { AsyncState } from "@/components/app/AsyncState";
import { ConfirmDestructiveAction } from "@/components/app/ConfirmDestructiveAction";

export const Route = createFileRoute("/_authenticated/dashboard/saude/")({
  head: () => ({
    meta: [
      { title: "Central de Saúde — AdoptPlace" },
      { name: "description", content: "Agenda e visão geral de saúde dos seus animais." },
    ],
  }),
  component: Page,
});

const SITUACOES: { value: AgendaSituacaoFilter | "TODAS"; label: string }[] = [
  { value: "TODAS", label: "Todas" },
  { value: "ATRASADO", label: "Atrasadas" },
  { value: "HOJE", label: "Hoje" },
  { value: "PROXIMOS_7_DIAS", label: "Próximos 7 dias" },
  { value: "PROXIMOS_30_DIAS", label: "Próximos 30 dias" },
  { value: "CONCLUIDO", label: "Concluídas" },
  { value: "CANCELADO", label: "Canceladas" },
];

function toIsoDate(date: string): string {
  return new Date(date).toISOString();
}
function toIsoDateTime(value: string): string {
  return new Date(value).toISOString();
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function Page() {
  const queryClient = useQueryClient();
  const [situacao, setSituacao] = useState<AgendaSituacaoFilter | "TODAS">("TODAS");

  const overviewQuery = useQuery({
    queryKey: ["health-overview"],
    queryFn: fetchHealthOverview,
  });
  const agendaQuery = useQuery({
    queryKey: ["health-agenda", situacao],
    queryFn: () => fetchHealthAgenda(situacao === "TODAS" ? {} : { situacao }),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["health-overview"] });
    await queryClient.invalidateQueries({ queryKey: ["health-agenda"] });
  };

  return (
    <div className="min-w-0">
      <h1 className="font-serif text-3xl font-semibold">Central de Saúde</h1>
      <p className="text-sm text-muted-foreground">
        Agenda e visão geral dos cuidados dos seus animais.
      </p>

      {/* Visão geral */}
      <AsyncState
        isLoading={overviewQuery.isLoading}
        isError={overviewQuery.isError}
        error={overviewQuery.error}
        onRetry={() => overviewQuery.refetch()}
      >
        {overviewQuery.data ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Atrasadas"
              value={overviewQuery.data.groups.overdue.length}
              tone="destructive"
            />
            <Metric label="Hoje" value={overviewQuery.data.groups.today.length} />
            <Metric label="Próximos 7 dias" value={overviewQuery.data.groups.next7Days.length} />
            <Metric label="Próximos 30 dias" value={overviewQuery.data.groups.next30Days.length} />
          </div>
        ) : null}
      </AsyncState>

      {overviewQuery.data && overviewQuery.data.positiveTests.length > 0 && (
        <div className="mt-6">
          <h2 className="font-serif text-lg font-semibold">Animais com teste positivo</h2>
          <ul className="mt-2 divide-y rounded-xl border bg-card text-sm">
            {overviewQuery.data.positiveTests.map((t) => (
              <li key={`${t.animalId}-${t.recordedAt}`} className="flex justify-between p-3">
                <Link
                  to="/dashboard/animais/$animalId"
                  params={{ animalId: t.animalId }}
                  className="hover:underline"
                >
                  {t.animalNome}
                </Link>
                <span className="text-muted-foreground">
                  {t.disease} · {fmtDate(t.recordedAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {overviewQuery.data && overviewQuery.data.animalsWithoutHistory.length > 0 && (
        <div className="mt-6">
          <h2 className="font-serif text-lg font-semibold">Animais sem histórico de saúde</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {overviewQuery.data.animalsWithoutHistory.map((a) => (
              <li key={a.id}>
                <Link
                  to="/dashboard/animais/$animalId"
                  params={{ animalId: a.id }}
                  className="rounded-md border bg-card px-3 py-1 text-sm hover:bg-muted"
                >
                  {a.nome}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Registrar consulta */}
      <div className="mt-8">
        <ConsultaForm onSaved={invalidate} />
      </div>

      {/* Agenda */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-xl font-semibold">Agenda</h2>
          <div className="w-52">
            <Select value={situacao} onValueChange={(v) => setSituacao(v as typeof situacao)}>
              <SelectTrigger aria-label="Filtrar agenda por situação">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SITUACOES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <AsyncState
          isLoading={agendaQuery.isLoading}
          isError={agendaQuery.isError}
          error={agendaQuery.error}
          onRetry={() => agendaQuery.refetch()}
          isEmpty={
            !agendaQuery.isLoading && !agendaQuery.isError && (agendaQuery.data?.length ?? 0) === 0
          }
          emptyState={{
            title: "Nenhum cuidado nesta situação",
            description: "Selecione outro filtro ou registre uma consulta futura.",
          }}
          className="mt-4"
        >
          <ul className="mt-4 space-y-3">
            {(agendaQuery.data ?? []).map((item) => (
              <AgendaRow key={item.id} item={item} onChanged={invalidate} />
            ))}
          </ul>
        </AsyncState>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: "destructive" }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={`mt-1 font-serif text-3xl font-semibold ${tone === "destructive" && value > 0 ? "text-destructive" : ""}`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function ConsultaForm({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [animalId, setAnimalId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [local, setLocal] = useState("");
  const [saving, setSaving] = useState(false);

  const animaisQuery = useQuery({
    queryKey: ["animais-picker"],
    queryFn: () => fetchAnimaisGerenciados(),
    enabled: open,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!animalId) {
      toast.error("Selecione o animal");
      return;
    }
    if (!titulo.trim()) {
      toast.error("Informe o título da consulta");
      return;
    }
    if (!data) {
      toast.error("Informe a data e hora");
      return;
    }
    setSaving(true);
    try {
      await registrarConsulta({
        animalId,
        titulo: titulo.trim(),
        dataHoraPlanejada: toIsoDateTime(data),
        ...(local.trim() ? { localProfissional: local.trim() } : {}),
      });
      onSaved();
      toast.success("Consulta registrada");
      setAnimalId("");
      setTitulo("");
      setData("");
      setLocal("");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Registrar consulta futura
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border bg-muted/30 p-4">
      <p className="mb-3 text-sm font-medium">Nova consulta</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="mb-1 block text-xs">Animal</Label>
          <Select value={animalId} onValueChange={setAnimalId}>
            <SelectTrigger>
              <SelectValue placeholder={animaisQuery.isLoading ? "Carregando…" : "Selecione"} />
            </SelectTrigger>
            <SelectContent>
              {(animaisQuery.data ?? []).map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="c-titulo" className="mb-1 block text-xs">
            Título
          </Label>
          <Input
            id="c-titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Retorno cardiologista"
          />
        </div>
        <div>
          <Label htmlFor="c-data" className="mb-1 block text-xs">
            Data e hora
          </Label>
          <Input
            id="c-data"
            type="datetime-local"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="c-local" className="mb-1 block text-xs">
            Local / profissional (opcional)
          </Label>
          <Input id="c-local" value={local} onChange={(e) => setLocal(e.target.value)} />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Salvando…" : "Registrar"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function AgendaRow({ item, onChanged }: { item: HealthAgendaItem; onChanged: () => void }) {
  const [mode, setMode] = useState<"none" | "complete" | "reschedule">("none");
  const [busy, setBusy] = useState(false);
  const pending = item.status === "PENDENTE";

  const situacaoLabel: Record<HealthAgendaItem["situacao"], string> = {
    ATRASADO: "Atrasada",
    HOJE: "Hoje",
    PROXIMO: "Próxima",
    CONCLUIDO: "Concluída",
    CANCELADO: "Cancelada",
  };

  const doCancel = async () => {
    setBusy(true);
    try {
      await cancelarCuidado(item.id);
      onChanged();
      toast.success("Cuidado cancelado");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro";
      toast.error(message);
      throw new Error(message);
    } finally {
      setBusy(false);
    }
  };

  const doCompleteConsulta = async () => {
    setBusy(true);
    try {
      await concluirCuidado(item.id);
      onChanged();
      toast.success("Consulta concluída");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">
            {item.titulo}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              ({tipoCuidadoPlanejadoLabel[item.tipo]})
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            <Link
              to="/dashboard/animais/$animalId"
              params={{ animalId: item.animalId }}
              className="hover:underline"
            >
              {item.animal.nome}
            </Link>{" "}
            · {fmtDate(item.dataHoraPlanejada)} · {situacaoLabel[item.situacao]}
          </p>
        </div>
        {pending && (
          <div className="flex flex-wrap gap-2">
            {item.tipo === "CONSULTA" ? (
              <Button size="sm" disabled={busy} onClick={doCompleteConsulta}>
                Concluir
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => setMode(mode === "complete" ? "none" : "complete")}
              >
                Concluir
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => setMode(mode === "reschedule" ? "none" : "reschedule")}
            >
              Reagendar
            </Button>
            <ConfirmDestructiveAction
              title="Cancelar este cuidado?"
              item={`${item.titulo} — ${item.animal.nome}`}
              consequence="O cuidado planejado será cancelado; registros de saúde já concluídos serão preservados."
              confirmLabel="Cancelar cuidado"
              disabled={busy}
              onConfirm={doCancel}
              trigger={
                <Button size="sm" variant="outline" className="text-destructive">
                  Cancelar
                </Button>
              }
            />
          </div>
        )}
      </div>

      {mode === "reschedule" && pending && (
        <RescheduleForm
          item={item}
          onDone={() => {
            setMode("none");
            onChanged();
          }}
        />
      )}
      {mode === "complete" && pending && item.tipo !== "CONSULTA" && (
        <CompletionForm
          item={item}
          onDone={() => {
            setMode("none");
            onChanged();
          }}
        />
      )}
    </li>
  );
}

function RescheduleForm({ item, onDone }: { item: HealthAgendaItem; onDone: () => void }) {
  const [data, setData] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) {
      toast.error("Informe a nova data");
      return;
    }
    setBusy(true);
    try {
      await reagendarCuidado(item.id, toIsoDateTime(data));
      toast.success("Reagendado");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-2 border-t pt-3">
      <div>
        <Label htmlFor={`r-${item.id}`} className="mb-1 block text-xs">
          Nova data e hora
        </Label>
        <Input
          id={`r-${item.id}`}
          type="datetime-local"
          value={data}
          onChange={(e) => setData(e.target.value)}
        />
      </div>
      <Button type="submit" size="sm" disabled={busy}>
        {busy ? "…" : "Salvar"}
      </Button>
    </form>
  );
}

function CompletionForm({ item, onDone }: { item: HealthAgendaItem; onDone: () => void }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [dataAplicacao, setDataAplicacao] = useState(hoje);
  const [nome, setNome] = useState("");
  const [freq, setFreq] = useState("");
  const [resultado, setResultado] = useState<"POSITIVO" | "NEGATIVO" | "">("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    let payload: ConclusaoCuidado;
    const base = { dataAplicacao: toIsoDate(dataAplicacao) };
    try {
      if (item.tipo === "VACINA") {
        if (!nome.trim()) return toast.error("Informe o nome da vacina");
        payload = { tipoRegistro: "VACINA", nomeCustom: nome.trim(), ...base };
      } else if (item.tipo === "CONTROLE_PARASITAS") {
        if (!nome.trim()) return toast.error("Informe o medicamento");
        if (!freq.trim()) return toast.error("Informe a frequência");
        payload = {
          tipoRegistro: "CONTROLE_PARASITAS",
          tipoMedicacao: nome.trim(),
          frequencia: freq.trim(),
          ...base,
        };
      } else if (item.tipo === "TESTE_DOENCA") {
        if (!nome.trim()) return toast.error("Informe a doença");
        if (resultado !== "POSITIVO" && resultado !== "NEGATIVO")
          return toast.error("Selecione o resultado");
        payload = { tipoRegistro: "TESTE_DOENCA", nomeCustom: nome.trim(), resultado, ...base };
      } else if (item.tipo === "MEDICAMENTO_TRATAMENTO") {
        if (!nome.trim()) return toast.error("Informe o medicamento/tratamento");
        payload = {
          tipoRegistro: "MEDICAMENTO_TRATAMENTO",
          medicamentoTratamento: nome.trim(),
          ...base,
        };
      } else if (item.tipo === "PROCEDIMENTO") {
        if (!nome.trim()) return toast.error("Informe o procedimento");
        payload = { tipoRegistro: "PROCEDIMENTO", procedimento: nome.trim(), ...base };
      } else {
        return;
      }
    } catch {
      return;
    }
    setBusy(true);
    try {
      await concluirCuidado(item.id, payload);
      toast.success("Cuidado concluído e registrado");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  };

  const nomeLabel =
    item.tipo === "VACINA"
      ? "Nome da vacina"
      : item.tipo === "CONTROLE_PARASITAS"
        ? "Medicamento"
        : item.tipo === "TESTE_DOENCA"
          ? "Doença testada"
          : item.tipo === "MEDICAMENTO_TRATAMENTO"
            ? "Medicamento / tratamento"
            : "Procedimento";

  return (
    <form onSubmit={submit} className="mt-3 grid gap-3 border-t pt-3 sm:grid-cols-2">
      <div>
        <Label htmlFor={`c-nome-${item.id}`} className="mb-1 block text-xs">
          {nomeLabel}
        </Label>
        <Input id={`c-nome-${item.id}`} value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      {item.tipo === "CONTROLE_PARASITAS" && (
        <div>
          <Label htmlFor={`c-freq-${item.id}`} className="mb-1 block text-xs">
            Frequência
          </Label>
          <Input
            id={`c-freq-${item.id}`}
            value={freq}
            onChange={(e) => setFreq(e.target.value)}
            placeholder="Ex.: A cada 3 meses"
          />
        </div>
      )}
      {item.tipo === "TESTE_DOENCA" && (
        <div className="sm:col-span-2">
          <Label className="mb-1 block text-xs">Resultado</Label>
          <RadioGroup
            value={resultado}
            onValueChange={(v) => setResultado(v as "POSITIVO" | "NEGATIVO")}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="POSITIVO" id={`pos-${item.id}`} />
              <Label htmlFor={`pos-${item.id}`}>Positivo</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="NEGATIVO" id={`neg-${item.id}`} />
              <Label htmlFor={`neg-${item.id}`}>Negativo</Label>
            </div>
          </RadioGroup>
        </div>
      )}
      <div>
        <Label htmlFor={`c-data-${item.id}`} className="mb-1 block text-xs">
          Data da realização
        </Label>
        <Input
          id={`c-data-${item.id}`}
          type="date"
          value={dataAplicacao}
          onChange={(e) => setDataAplicacao(e.target.value)}
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Concluindo…" : "Concluir e registrar"}
        </Button>
      </div>
    </form>
  );
}
