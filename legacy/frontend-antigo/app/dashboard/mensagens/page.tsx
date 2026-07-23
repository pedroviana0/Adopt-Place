import { ConversationList } from "@/components/app/mensagens/conversation-list";
import { getConversationList } from "@/lib/queries/mensagens";
import { conversationFilterSchema } from "@/lib/schemas/dashboard-filters";

export default async function MensagensPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const parsed = conversationFilterSchema.safeParse(await searchParams);
  const filters = parsed.success ? parsed.data : {};
  const conversations = await getConversationList(filters);

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-semibold">Mensagens</h1><p className="text-sm text-[var(--muted-foreground)]">Conversas vinculadas a solicitacoes de adocao aprovadas.</p></div>
    {!parsed.success ? <p role="alert" className="text-sm text-[var(--destructive)]">O filtro informado e invalido e foi ignorado.</p> : null}
    <ConversationList conversations={conversations} activeFilter={filters.status} />
  </div>;
}
