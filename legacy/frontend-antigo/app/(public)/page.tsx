import { getPublicMetrics } from "@/lib/queries/public-metrics";
import { getShowcaseAnimals, getShowcaseFilterOptions } from "@/lib/queries/animal-showcase";
import { parseShowcaseFilters, type ShowcaseSearchParams } from "@/lib/schemas/showcase";
import { ShowcaseFilters } from "@/components/app/vitrine/showcase-filters";
import { Showcase } from "@/components/app/vitrine/showcase";

type HomePageProps = {
  searchParams?: Promise<ShowcaseSearchParams>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const filters = parseShowcaseFilters(await searchParams);
  const [metrics, showcase, options] = await Promise.all([
    getPublicMetrics(),
    getShowcaseAnimals(filters),
    getShowcaseFilterOptions(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="grid gap-8 py-8 lg:grid-cols-[1fr_360px] lg:items-center">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">Adocao responsavel</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-normal sm:text-5xl">
            Encontre animais resgatados prontos para uma nova familia
          </h1>
          <p className="max-w-2xl text-lg text-[var(--muted-foreground)]">
            Busque por especie, porte, sexo, cidade e cuidados ja registrados antes de abrir o perfil completo.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#vitrine" className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white">
              Ver animais
            </a>
            <a href="/login" className="rounded-md border px-4 py-2 text-sm font-medium">
              Entrar
            </a>
          </div>
        </div>
        <dl className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-md border bg-white p-4">
            <dt className="text-sm text-[var(--muted-foreground)]">Disponiveis</dt>
            <dd className="text-3xl font-semibold">{metrics.availableAnimals}</dd>
          </div>
          <div className="rounded-md border bg-white p-4">
            <dt className="text-sm text-[var(--muted-foreground)]">Responsaveis</dt>
            <dd className="text-3xl font-semibold">{metrics.responsibleParties}</dd>
          </div>
          <div className="rounded-md border bg-white p-4">
            <dt className="text-sm text-[var(--muted-foreground)]">Adocoes concluidas</dt>
            <dd className="text-3xl font-semibold">{metrics.completedAdoptions}</dd>
          </div>
        </dl>
      </section>

      <section id="vitrine" className="space-y-6 py-8">
        <div>
          <h2 className="text-2xl font-semibold">Animais disponiveis</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            A vitrine mostra apenas animais com status disponivel para adocao.
          </p>
        </div>
        <ShowcaseFilters filters={filters} options={options} />
        <Showcase {...showcase} filters={filters} />
      </section>
    </div>
  );
}
