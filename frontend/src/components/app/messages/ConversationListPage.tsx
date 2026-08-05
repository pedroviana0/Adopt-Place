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
import { AsyncState } from "@/components/app/AsyncState";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Archive } from "lucide-react";

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
        <div className="w-full sm:w-44">
          <Label htmlFor={`conversation-status-${audience}`} className="sr-only">
            Filtrar conversas por situação
          </Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as ConversationStatusFilter)}
          >
            <SelectTrigger id={`conversation-status-${audience}`}>
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

      <AsyncState
        isLoading={conversasQuery.isLoading}
        isError={conversasQuery.isError}
        error={conversasQuery.error}
        isEmpty={(conversasQuery.data?.conversations.length ?? 0) === 0}
        loadingLabel="Carregando conversas…"
        loadingFallback={<ConversationListSkeleton />}
        errorTitle="Não foi possível carregar as conversas"
        onRetry={() => conversasQuery.refetch()}
        emptyState={{
          title:
            status === "todas"
              ? "Nenhuma conversa disponível"
              : `Nenhuma conversa ${status === "ativas" ? "ativa" : "arquivada"}`,
          description:
            status === "todas"
              ? "As conversas são liberadas quando uma solicitação de adoção é aprovada."
              : "Altere o filtro para consultar outras conversas.",
        }}
      >
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
      </AsyncState>
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
      className="flex min-w-0 flex-col gap-3 p-4 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
          <span className="break-words">{conversation.counterparty.label}</span>
          <span className="text-xs font-normal text-muted-foreground">
            · {conversation.animal.nome}
          </span>
          {conversation.status === "ARQUIVADA" && (
            <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
              <Archive className="h-3 w-3" aria-hidden="true" />
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
      <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-1">
        <span className="text-xs text-muted-foreground">
          {new Date(conversation.updatedAt).toLocaleDateString("pt-BR")}
        </span>
        {conversation.unreadCount > 0 && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
            <span className="sr-only">Mensagens não lidas: </span>
            {conversation.unreadCount}
          </span>
        )}
      </div>
    </Link>
  );
}

function ConversationListSkeleton() {
  return (
    <div className="mt-6 divide-y rounded-xl border bg-card" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex items-center justify-between gap-3 p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
          <Skeleton className="h-5 w-12" />
        </div>
      ))}
    </div>
  );
}
