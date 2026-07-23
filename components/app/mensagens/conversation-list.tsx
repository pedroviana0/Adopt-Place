"use client";

import { Archive, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge, Select } from "@/components/ui";
import type { ConversationListItem } from "@/lib/queries/mensagens";
import type { ConversationFilters } from "@/lib/schemas/dashboard-filters";

export function ConversationList({ conversations, activeFilter }: { conversations: ConversationListItem[]; activeFilter?: ConversationFilters["status"] }) {
  const router = useRouter();
  return <div className="space-y-4">
    <div className="max-w-xs"><label className="mb-1 block text-sm font-medium" htmlFor="conversation-filter">Filtrar conversas</label><Select id="conversation-filter" value={activeFilter ?? "todas"} onChange={(event) => router.push(`/dashboard/mensagens?status=${event.target.value}`)}><option value="todas">Todas</option><option value="ativas">Ativas</option><option value="arquivadas">Arquivadas</option></Select></div>
    {conversations.length === 0 ? <p className="border-y py-8 text-center text-sm text-[var(--muted-foreground)]">Nenhuma conversa encontrada.</p> : <ul className="divide-y rounded-md border">{conversations.map((conversation) => <li key={conversation.id}><Link href={conversation.href} className="flex items-center gap-3 p-4 hover:bg-[var(--muted)]"><span className="flex size-10 shrink-0 items-center justify-center rounded-full border">{conversation.status === "ARQUIVADA" ? <Archive className="size-4" /> : <MessageCircle className="size-4" />}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate text-sm font-medium">{conversation.animal.nome}</span><Badge variant={conversation.status === "ATIVA" ? "outline" : "secondary"}>{conversation.status === "ATIVA" ? "Ativa" : "Arquivada"}</Badge></span><span className="block truncate text-xs text-[var(--muted-foreground)]">{conversation.counterparty.label}{conversation.lastMessage ? ` | ${conversation.lastMessage.authorIsMe ? "Voce: " : ""}${conversation.lastMessage.textPreview}` : " | Sem mensagens"}</span></span><span className="flex shrink-0 flex-col items-end gap-1">{conversation.lastMessage ? <time className="text-xs text-[var(--muted-foreground)]" dateTime={conversation.lastMessage.sentAt.toISOString()}>{conversation.lastMessage.sentAt.toLocaleDateString("pt-BR")}</time> : null}{conversation.unreadCount > 0 ? <Badge>{conversation.unreadCount}</Badge> : null}</span></Link></li>)}</ul>}
  </div>;
}
