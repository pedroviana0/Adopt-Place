import { Badge } from "@/components/ui/badge";
import { statusAnimalLabel, statusSolicitacaoLabel, type StatusAnimal, type StatusSolicitacao } from "@/lib/domain/enums";

const animalColors: Record<StatusAnimal, string> = {
  RESGATADO: "bg-muted text-muted-foreground",
  EM_CUIDADOS: "bg-chart-4/20 text-foreground",
  DISPONIVEL: "bg-primary text-primary-foreground",
  EM_PROCESSO_ADOCAO: "bg-accent text-accent-foreground",
  ADOTADO: "bg-secondary text-secondary-foreground",
};
const solicColors: Record<StatusSolicitacao, string> = {
  EM_ANALISE: "bg-chart-4/20 text-foreground",
  APROVADA: "bg-primary text-primary-foreground",
  RECUSADA: "bg-destructive text-destructive-foreground",
  CONCLUIDA: "bg-secondary text-secondary-foreground",
};

export function StatusBadge({ status }: { status: StatusAnimal }) {
  return <Badge className={animalColors[status]}>{statusAnimalLabel[status]}</Badge>;
}
export function StatusSolicitacaoBadge({ status }: { status: StatusSolicitacao }) {
  return <Badge className={solicColors[status]}>{statusSolicitacaoLabel[status]}</Badge>;
}
