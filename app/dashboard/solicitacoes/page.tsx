import { RequestList } from "@/components/app/solicitacoes/request-list";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { requireResponsible } from "@/lib/actions/auth-guards";
import { getOwnerRequests } from "@/lib/queries/owner-requests";

export default async function SolicitacoesPage() {
  const session = await requireResponsible();

  const responsavelId =
    session.user.tipoPerfil === "ORGANIZACAO"
      ? session.user.organizacaoId
      : session.user.acolhedorId;

  const requests = await getOwnerRequests(responsavelId!, session.user.tipoPerfil as "ORGANIZACAO" | "ACOLHEDOR");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Solicitacoes</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Solicitacoes de adocao recebidas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Lista de Solicitacoes</h2>
        </CardHeader>
        <CardContent>
          <RequestList requests={requests} />
        </CardContent>
      </Card>
    </div>
  );
}
