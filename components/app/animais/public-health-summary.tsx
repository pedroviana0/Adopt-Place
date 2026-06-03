import { TipoRegistroSaude } from "@prisma/client";

import { Badge } from "@/components/ui";

type HealthRecord = {
  id: string;
  tipo: TipoRegistroSaude;
  dataRegistro: Date;
  dataProxima: Date | null;
  nomeVacina: string | null;
  tipoMedicamento: string | null;
  frequencia: string | null;
  nomeDoenca: string | null;
  resultado: "POSITIVO" | "NEGATIVO" | null;
};

type PublicHealthSummaryProps = {
  records: HealthRecord[];
};

const sectionLabels: Record<TipoRegistroSaude, string> = {
  VACINA: "Vacinas",
  CONTROLE_PARASITAS: "Controle de parasitas",
  TESTE_DOENCA: "Testes de doencas",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
}

function recordLabel(record: HealthRecord) {
  if (record.tipo === "VACINA") {
    return record.nomeVacina ?? "Vacina registrada";
  }

  if (record.tipo === "CONTROLE_PARASITAS") {
    return [record.tipoMedicamento, record.frequencia].filter(Boolean).join(" - ") || "Controle registrado";
  }

  return `${record.nomeDoenca ?? "Doenca testada"}: ${record.resultado === "POSITIVO" ? "positivo" : "negativo"}`;
}

export function PublicHealthSummary({ records }: PublicHealthSummaryProps) {
  const visibleSections = Object.values(TipoRegistroSaude)
    .map((tipo) => ({ tipo, records: records.filter((record) => record.tipo === tipo) }))
    .filter((section) => section.records.length > 0);

  if (visibleSections.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Resumo de saude</h2>
      <div className="grid gap-3 md:grid-cols-3">
        {visibleSections.map((section) => (
          <div key={section.tipo} className="rounded-md border bg-white p-4">
            <h3 className="font-medium">{sectionLabels[section.tipo]}</h3>
            <ul className="mt-3 space-y-2">
              {section.records.map((record) => (
                <li key={record.id} className="text-sm">
                  <div>{recordLabel(record)}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[var(--muted-foreground)]">
                    <Badge variant="outline">{formatDate(record.dataRegistro)}</Badge>
                    {record.dataProxima ? <Badge variant="secondary">Proxima: {formatDate(record.dataProxima)}</Badge> : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
