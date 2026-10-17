import type { OperationalDashboard as Data } from "@/lib/data/dashboard";
import { AdoptionFunnel } from "./AdoptionFunnel";
import { IndicatorGroups } from "./IndicatorGroups";
import { PriorityList } from "./PriorityList";
import { RecentActivity } from "./RecentActivity";
import { StatusBar } from "./StatusBar";

// Spec 011: painel de gestão extraído da rota. Recebe os dados por prop para o
// render estático dos testes (__tests__/frontend/dashboard-render.test.ts).
// Ordem (D1, RF-EST-01): pendências → indicadores → status + funil → atividade.
export function OperationalDashboard({ data }: { data: Data }) {
  return (
    <div className="mt-6 space-y-8">
      <PriorityList items={data.priorityItems} />
      <IndicatorGroups indicators={data.indicators} />
      <div className="grid gap-6 lg:grid-cols-2">
        <StatusBar counts={data.animalStatusCounts} />
        <AdoptionFunnel funnel={data.adoptionFunnel} />
      </div>
      <RecentActivity items={data.recentActivity} />
    </div>
  );
}
