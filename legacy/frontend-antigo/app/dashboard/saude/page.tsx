import { CalendarDays, FileText } from "lucide-react";
import Link from "next/link";

import { HealthOverview } from "@/components/app/saude/health-overview";
import { getHealthOverview } from "@/lib/queries/health-dashboard";

export default async function SaudePage() {
  const overview = await getHealthOverview();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Saude</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Cuidados e pontos de atencao dos seus animais.
          </p>
        </div>
        <div className="flex gap-2">
          <Link className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-[var(--muted)]" href="/dashboard/saude/agenda">
            <CalendarDays className="size-4" aria-hidden="true" /> Agenda
          </Link>
          <Link className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-[var(--muted)]" href="/dashboard/saude/documentos">
            <FileText className="size-4" aria-hidden="true" /> Documentos
          </Link>
        </div>
      </div>
      <HealthOverview overview={overview} />
    </div>
  );
}
