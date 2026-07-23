import { Activity, Pill, ShieldCheck, Stethoscope, Syringe } from "lucide-react";

import { Badge } from "@/components/ui";
import type { AnimalHealthTimelineItem } from "@/lib/queries/health-dashboard";

const labels = { VACINA: "Vacina", CONTROLE_PARASITAS: "Controle de parasitas", TESTE_DOENCA: "Teste de doenca", MEDICAMENTO_TRATAMENTO: "Medicamento ou tratamento", PROCEDIMENTO: "Procedimento" } as const;
const icons = { VACINA: Syringe, CONTROLE_PARASITAS: ShieldCheck, TESTE_DOENCA: Stethoscope, MEDICAMENTO_TRATAMENTO: Pill, PROCEDIMENTO: Activity } as const;

function title(record: AnimalHealthTimelineItem): string {
  if (record.tipo === "VACINA") return record.nomeVacina ?? record.titulo ?? labels.VACINA;
  if (record.tipo === "CONTROLE_PARASITAS") return record.tipoMedicamento ?? record.titulo ?? labels.CONTROLE_PARASITAS;
  if (record.tipo === "TESTE_DOENCA") return record.nomeDoenca ?? record.titulo ?? labels.TESTE_DOENCA;
  if (record.tipo === "MEDICAMENTO_TRATAMENTO") return record.medicamentoTratamento ?? record.titulo ?? labels.MEDICAMENTO_TRATAMENTO;
  return record.procedimento ?? record.titulo ?? labels.PROCEDIMENTO;
}

export function HealthHistoryTimeline({ records }: { records: AnimalHealthTimelineItem[] }) {
  if (records.length === 0) return <p className="py-6 text-sm text-[var(--muted-foreground)]">Nenhum registro de saude realizado.</p>;
  return <ol className="relative ml-3 border-l pl-6">{records.map((record) => { const Icon = icons[record.tipo]; return <li key={record.id} className="relative pb-6 last:pb-0"><span className="absolute -left-[2.15rem] flex size-6 items-center justify-center rounded-full border bg-white"><Icon className="size-3.5" /></span><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{title(record)}</h3><Badge variant="outline">{labels[record.tipo]}</Badge>{record.resultado ? <Badge variant={record.resultado === "POSITIVO" ? "destructive" : "secondary"}>{record.resultado}</Badge> : null}</div><time className="text-xs text-[var(--muted-foreground)]" dateTime={record.dataRegistro.toISOString()}>{record.dataRegistro.toLocaleDateString("pt-BR")}</time>{record.observacoes ? <p className="mt-2 whitespace-pre-wrap text-sm">{record.observacoes}</p> : null}{record.profissionalClinica ? <p className="mt-1 text-xs text-[var(--muted-foreground)]">{record.profissionalClinica}</p> : null}</li>; })}</ol>;
}
