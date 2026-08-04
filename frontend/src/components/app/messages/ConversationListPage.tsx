import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchConversas, type ConversationStatusFilter } from "@/lib/data/mensagens";
import { statusConversaAdocaoLabel } from "@/lib/domain/enums";

interface ConversationListPageProps {
  audience: "adopter" | "responsible";
}

export function ConversationListPage({ audience }: ConversationListPageProps) {
  const [status, setStatus] = useState<ConversationStatusFilter>("todas");
  const conversasQuery = useQuery({
    queryKey: ["conversas", status],
    queryFn: () => fetchConversas(status),
    refetchInterval: 20_000,
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">Mensagens</h1>
        <div className="w-44">
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as ConversationStatusFilter)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="ativas">Ativas</SelectItem>
              <SelectItem value="arquivadas">Arquivadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Conversas liberadas após a aprovação de uma solicitação.
      </p>

      {conversasQuery.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Carregando…</p>
      ) : conversasQuery.isError ? (
        <p className="mt-6 text-sm text-destructive">
          {conversasQuery.error instanceof Error
            ? conversasQuery.error.message
            : "Não foi possível carregar as conversas."}
        </p>
      ) : (conversasQuery.data?.conversations.length ?? 0) === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Nenhuma conversa.</p>
      ) : (
        <ul className="mt-6 divide-y rounded-xl border bg-card">
          {conversasQuery.data!.conversations.map((conversation) => (
            <li key={conversation.id}>
              {audience === "adopter" ? (
                <ConversationLink conversation={conversation} to="/mensagens/$conversaId" />
              ) : (
                <ConversationLink
                  conversation={conversation}
                  to="/dashboard/mensagens/$conversaId"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface ConversationLinkProps {
  conversation: Awaited<ReturnType<typeof fetchConversas>>["conversations"][number];
  to: "/mensagens/$conversaId" | "/dashboard/mensagens/$conversaId";
}

function ConversationLink({ conversation, to }: ConversationLinkProps) {
  return (
    <Link
      to={to}
      params={{ conversaId: conversation.id }}
      className="flex items-center justify-between gap-3 p-4 hover:bg-muted/50"
    >
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-medium">
          <span className="truncate">{conversation.counterparty.label}</span>
          <span className="text-xs font-normal text-muted-foreground">
            · {conversation.animal.nome}
          </span>
          {conversation.status === "ARQUIVADA" && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
              {statusConversaAdocaoLabel.ARQUIVADA}
            </span>
          )}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {conversation.lastMessage
            ? `${conversation.lastMessage.authorIsMe ? "Você: " : ""}${conversation.lastMessage.textPreview}`
            : "Sem mensagens ainda"}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-xs text-muted-foreground">
          {new Date(conversation.updatedAt).toLocaleDateString("pt-BR")}
        </span>
        {conversation.unreadCount > 0 && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
            {conversation.unreadCount}
          </span>
        )}
      </div>
    </Link>
  );
}
