import { Badge } from "@/components/ui/badge";
import { SituacaoLT } from "@/lib/domain/enums";

// Indicadores de gestao da spec 009 (C15). So aparecem no painel: vitrine,
// Feels e perfis publicos nao recebem estes campos (D4, D7). O texto vai
// sempre escrito, para nao depender de cor.
export function AnimalIndicators({
  emTratamento,
  situacaoLT,
  larTemporario,
}: {
  emTratamento: boolean;
  situacaoLT: SituacaoLT;
  larTemporario: { nomeTutor: string } | null;
}) {
  return (
    <>
      {emTratamento && (
        <Badge className="border-transparent bg-information-muted text-information-muted-foreground">
          Em tratamento
        </Badge>
      )}
      {situacaoLT === SituacaoLT.PROCURANDO && (
        <Badge className="border-transparent bg-warning-muted text-warning-muted-foreground">
          Procurando LT
        </Badge>
      )}
      {situacaoLT === SituacaoLT.EM_LT && (
        <Badge className="border-transparent bg-success-muted text-success-muted-foreground">
          {larTemporario ? `Em LT · ${larTemporario.nomeTutor}` : "Em LT · sem registro"}
        </Badge>
      )}
    </>
  );
}
