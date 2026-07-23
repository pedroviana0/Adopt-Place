import { RequestList } from "@/components/app/solicitacoes/request-list";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { requireResponsible } from "@/lib/actions/auth-guards";
import { getOwnerRequests } from "@/lib/queries/owner-requests";
import { ownerRequestFilterSchema } from "@/lib/schemas/dashboard-filters";

export default async function SolicitacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const session = await requireResponsible();
  const parsed = ownerRequestFilterSchema.safeParse(await searchParams);
  const filters = parsed.success ? parsed.data : {};

  const responsavelId =
    session.user.tipoPerfil === "ORGANIZACAO"
      ? session.user.organizacaoId
      : session.user.acolhedorId;

  const requests = await getOwnerRequests(
    responsavelId!,
    session.user.tipoPerfil as "ORGANIZACAO" | "ACOLHEDOR",
    filters,
  );

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
          <RequestList requests={requests} activeStatus={filters.status} />
        </CardContent>
      </Card>
    </div>
  );
}
