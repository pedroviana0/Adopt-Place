"use client";

import { Plus, Save, Trash2, X } from "lucide-react";
import { TipoRegistroSaude } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button, Input, Select, Textarea } from "@/components/ui";
import { completeCuidadoPlanejado } from "@/lib/actions/cuidados-planejados";
import { createRegistroSaude, deleteRegistroSaude } from "@/lib/actions/registro-saude";
import { registroSaudeSchema, type RegistroSaudeInput } from "@/lib/schemas/registro-saude";

type HealthRecord = {
  id: string;
  tipo: TipoRegistroSaude;
  dataAplicacao: Date;
  dataProximaDose: Date | null;
  resultado: string | null;
  nomeCustom: string | null;
  tipoMedicacao: string | null;
  frequencia: string | null;
  vacinaId: string | null;
};

type FormState = {
  tipo: TipoRegistroSaude;
  detalhe: string;
  frequencia: string;
  resultado: "" | "POSITIVO" | "NEGATIVO";
  dataAplicacao: string;
  dataProxima: string;
  titulo: string;
  observacoes: string;
  profissionalClinica: string;
};

const labels: Record<TipoRegistroSaude, string> = {
  VACINA: "Vacina",
  CONTROLE_PARASITAS: "Controle de parasitas",
  TESTE_DOENCA: "Teste de doenca",
  MEDICAMENTO_TRATAMENTO: "Medicamento ou tratamento",
  PROCEDIMENTO: "Procedimento ou cirurgia",
};

function emptyForm(initialType?: TipoRegistroSaude): FormState {
  return {
    tipo: initialType ?? TipoRegistroSaude.VACINA,
    detalhe: "",
    frequencia: "",
    resultado: "",
    dataAplicacao: "",
    dataProxima: "",
    titulo: "",
    observacoes: "",
    profissionalClinica: "",
  };
}

function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function toDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

function payload(form: FormState): RegistroSaudeInput {
  const common = {
    dataAplicacao: toDate(form.dataAplicacao),
    titulo: optional(form.titulo),
    observacoes: optional(form.observacoes),
    profissionalClinica: optional(form.profissionalClinica),
  };
  const nextDate = form.dataProxima ? toDate(form.dataProxima) : undefined;

  if (form.tipo === TipoRegistroSaude.VACINA) {
    return { ...common, tipoRegistro: "VACINA", nomeCustom: form.detalhe, dataProximaDose: nextDate };
  }
  if (form.tipo === TipoRegistroSaude.CONTROLE_PARASITAS) {
    return { ...common, tipoRegistro: "CONTROLE_PARASITAS", tipoMedicacao: form.detalhe, frequencia: form.frequencia, dataProxima: nextDate };
  }
  if (form.tipo === TipoRegistroSaude.TESTE_DOENCA) {
    return { ...common, tipoRegistro: "TESTE_DOENCA", nomeCustom: form.detalhe, resultado: form.resultado as "POSITIVO" | "NEGATIVO", dataProxima: nextDate };
  }
  if (form.tipo === TipoRegistroSaude.MEDICAMENTO_TRATAMENTO) {
    return { ...common, tipoRegistro: "MEDICAMENTO_TRATAMENTO", medicamentoTratamento: form.detalhe, dataProxima: nextDate };
  }
  return { ...common, tipoRegistro: "PROCEDIMENTO", procedimento: form.detalhe, dataProxima: nextDate };
}

export function HealthRecordPanel({ records, animalId, canEdit, plannedCareId, initialType }: { records: HealthRecord[]; animalId: string; canEdit: boolean; plannedCareId?: string; initialType?: TipoRegistroSaude }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(Boolean(plannedCareId));
  const [form, setForm] = useState(() => emptyForm(initialType));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = registroSaudeSchema.safeParse(payload(form));
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Dados invalidos.");

    startTransition(async () => {
      const result = plannedCareId
        ? await completeCuidadoPlanejado(plannedCareId, parsed.data)
        : await createRegistroSaude(animalId, parsed.data);
      if (result.error) return setError(result.error);
      setError(null); setForm(emptyForm()); setShowForm(false);
      if (plannedCareId) router.replace(`/dashboard/animais/${animalId}/saude`);
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!window.confirm("Excluir este registro de saude?")) return;
    startTransition(async () => {
      const result = await deleteRegistroSaude(id);
      if (result.error) return setError(result.error);
      router.refresh();
    });
  }

  return <div className="space-y-4">
    {canEdit && !showForm ? <Button onClick={() => setShowForm(true)}><Plus className="mr-2 size-4" />Novo registro</Button> : null}
    {showForm ? <form onSubmit={submit} className="space-y-4 rounded-md border p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">Categoria<Select value={form.tipo} disabled={Boolean(initialType)} onChange={(event) => setForm((current) => ({ ...current, tipo: event.target.value as TipoRegistroSaude }))}>{Object.values(TipoRegistroSaude).map((type) => <option key={type} value={type}>{labels[type]}</option>)}</Select></label>
        <label className="space-y-1 text-sm font-medium">Data de realizacao<Input type="date" value={form.dataAplicacao} onChange={(event) => setForm((current) => ({ ...current, dataAplicacao: event.target.value }))} /></label>
        <label className="space-y-1 text-sm font-medium">{labels[form.tipo]}<Input value={form.detalhe} onChange={(event) => setForm((current) => ({ ...current, detalhe: event.target.value }))} /></label>
        {form.tipo === "CONTROLE_PARASITAS" ? <label className="space-y-1 text-sm font-medium">Frequencia<Input value={form.frequencia} onChange={(event) => setForm((current) => ({ ...current, frequencia: event.target.value }))} /></label> : null}
        {form.tipo === "TESTE_DOENCA" ? <label className="space-y-1 text-sm font-medium">Resultado<Select value={form.resultado} onChange={(event) => setForm((current) => ({ ...current, resultado: event.target.value as FormState["resultado"] }))}><option value="">Selecione</option><option value="POSITIVO">Positivo</option><option value="NEGATIVO">Negativo</option></Select></label> : null}
        <label className="space-y-1 text-sm font-medium">Proxima data<Input type="date" value={form.dataProxima} onChange={(event) => setForm((current) => ({ ...current, dataProxima: event.target.value }))} /></label>
        <label className="space-y-1 text-sm font-medium">Titulo opcional<Input value={form.titulo} onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))} /></label>
        <label className="space-y-1 text-sm font-medium">Profissional ou clinica<Input value={form.profissionalClinica} onChange={(event) => setForm((current) => ({ ...current, profissionalClinica: event.target.value }))} /></label>
      </div>
      <label className="block space-y-1 text-sm font-medium">Observacoes internas<Textarea value={form.observacoes} onChange={(event) => setForm((current) => ({ ...current, observacoes: event.target.value }))} /></label>
      {error ? <p role="alert" className="text-sm text-[var(--destructive)]">{error}</p> : null}
      <div className="flex gap-2"><Button type="submit" disabled={isPending}><Save className="mr-2 size-4" />{plannedCareId ? "Concluir cuidado" : "Salvar registro"}</Button><Button variant="ghost" onClick={() => setShowForm(false)}><X className="mr-2 size-4" />Fechar</Button></div>
    </form> : null}
    {records.length > 0 ? <ul className="divide-y rounded-md border">{records.map((record) => <li key={record.id} className="flex items-center justify-between gap-3 p-3"><div><p className="text-sm font-medium">{record.nomeCustom ?? record.tipoMedicacao ?? labels[record.tipo]}</p><p className="text-xs text-[var(--muted-foreground)]">{labels[record.tipo]} | {record.dataAplicacao.toLocaleDateString("pt-BR")}</p></div>{canEdit ? <Button variant="ghost" className="size-10 p-0" title="Excluir registro" disabled={isPending} onClick={() => remove(record.id)}><Trash2 className="size-4" /></Button> : null}</li>)}</ul> : null}
  </div>;
}
