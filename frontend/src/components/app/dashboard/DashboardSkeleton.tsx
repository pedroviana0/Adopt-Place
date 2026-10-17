import { Skeleton } from "@/components/ui/skeleton";

// O Skeleton padrão usa `bg-primary/10`, e o modificador de opacidade sobre
// token em var() não emite alpha nesta base (CLAUDE.md §8): sairia teal sólido.
const block = "bg-muted";

// Spec 011 (US6, C8): esqueleto no formato do painel. Mostra 2 grupos de cards
// (não 3) para o Acolhedor não ver um bloco a mais que some depois.
export function DashboardSkeleton() {
  return (
    <div aria-busy="true" className="mt-6 space-y-8">
      <span className="sr-only">Carregando painel…</span>
      <div className="space-y-3">
        <Skeleton className={`h-6 w-56 ${block}`} />
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className={`h-16 w-full rounded-xl ${block}`} />
        ))}
      </div>
      {[4, 3].map((cards, group) => (
        <div key={group} data-skeleton="grupo" className="space-y-3">
          <Skeleton className={`h-5 w-32 ${block}`} />
          <div className="grid gap-3 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
            {Array.from({ length: cards }, (_, card) => (
              <Skeleton key={card} className={`h-24 rounded-xl ${block}`} />
            ))}
          </div>
        </div>
      ))}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className={`h-40 rounded-xl ${block}`} />
        <Skeleton className={`h-40 rounded-xl ${block}`} />
      </div>
    </div>
  );
}
