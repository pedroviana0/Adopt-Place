import Link from "next/link";

import { HealthAgendaList } from "@/components/app/saude/health-agenda-list";
import { requireResponsible } from "@/lib/actions/auth-guards";
import { getHealthAgenda } from "@/lib/queries/health-dashboard";
import { getOwnedAnimals } from "@/lib/queries/owned-animals";
import { healthAgendaFilterSchema } from "@/lib/schemas/dashboard-filters";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AgendaSaudePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireResponsible();
  const rawFilters = await searchParams;
  const parsed = healthAgendaFilterSchema.safeParse(rawFilters);
  const filters = parsed.success ? parsed.data : {};
  const responsibleId =
    session.user.tipoPerfil === "ORGANIZACAO"
      ? session.user.organizacaoId!
      : session.user.acolhedorId!;

  const [items, animals] = await Promise.all([
    getHealthAgenda(filters),
    getOwnedAnimals(
      responsibleId,
      session.user.tipoPerfil as "ORGANIZACAO" | "ACOLHEDOR",
    ),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Agenda de saude</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Cuidados planejados em ordem cronologica.
          </p>
        </div>
        <Link className="text-sm font-medium underline-offset-4 hover:underline" href="/dashboard/saude">
          Voltar para visao geral
        </Link>
      </div>
      {!parsed.success ? (
        <p role="alert" className="text-sm text-[var(--destructive)]">
          Os filtros informados sao invalidos e foram ignorados.
        </p>
      ) : null}
      <HealthAgendaList
        items={items}
        filters={filters}
        animals={animals.map((animal) => ({ id: animal.id, nome: animal.nome }))}
      />
    </div>
  );
}
