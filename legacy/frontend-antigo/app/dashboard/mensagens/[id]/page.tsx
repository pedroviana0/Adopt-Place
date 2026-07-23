import Link from "next/link";

import { ConversationDetail } from "@/components/app/mensagens/conversation-detail";
import { markConversationRead } from "@/lib/actions/mensagens";
import { requireSession } from "@/lib/actions/auth-guards";
import { getConversationDetail } from "@/lib/queries/mensagens";

export default async function MensagemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const detail = await getConversationDetail(id);
  await markConversationRead(id);

  return <div className="space-y-5">
    <Link className="text-sm font-medium underline-offset-4 hover:underline" href="/dashboard/mensagens">Voltar para mensagens</Link>
    <ConversationDetail detail={detail} currentUserId={session.user.id} />
  </div>;
}
