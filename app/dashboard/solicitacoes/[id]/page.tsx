import { notFound } from "next/navigation";
import { StatusSolicitacao } from "@prisma/client";

import { RequestDecisionForm } from "@/components/app/solicitacoes/request-decision-form"
import { ScreeningReview as ScreeningReviewView } from "@/components/app/solicitacoes/screening-review";
import { Button, Card, CardContent, CardHeader } from "@/components/ui";
import { completeAdoption } from "@/lib/actions/solicitacoes";
import { requireResponsible } from "@/lib/actions/auth-guards";
import { getOwnerRequestDetail } from "@/lib/queries/owner-request-detail";

export default async function SolicitacaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireResponsible();

  const responsavelId =
    session.user.tipoPerfil === "ORGANIZACAO"
      ? session.user.organizacaoId
      : session.user.acolhedorId;

  const { id: solicitacaoId } = await params;

  const detail = await getOwnerRequestDetail(
    solicitacaoId,
    responsavelId!,
    session.user.tipoPerfil as "ORGANIZACAO" | "ACOLHEDOR",
  );

  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Solicitacao - {detail.animal.nome}
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Detalhes da solicitacao de adocao.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Triagem do Adotante</h2>
        </CardHeader>
        <CardContent>
          <ScreeningReviewView adotante={detail.adotante} />
        </CardContent>
      </Card>

      {detail.status === StatusSolicitacao.EM_ANALISE && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Decisao</h2>
          </CardHeader>
          <CardContent>
            <RequestDecisionForm
              solicitacaoId={solicitacaoId}
              onDecision={() => {}}
            />
          </CardContent>
        </Card>
      )}

      {detail.status === StatusSolicitacao.APROVADA && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Adocao Aprovada</h2>
          </CardHeader>
          <CardContent>
            <form
              action={async () => {
                "use server";
                await completeAdoption(solicitacaoId);
              }}
            >
              <Button type="submit">
                Concluir Adocao
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
