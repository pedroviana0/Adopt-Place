import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchConversas, type ConversationStatusFilter } from "@/lib/data/mensagens";
import { statusConversaAdocaoLabel } from "@/lib/domain/enums";

export const Route = createFileRoute("/_authenticated/dashboard/mensagens/")({
  head: () => ({
    meta: [
      { title: "Mensagens — AdoptPlace" },
      { name: "description", content: "Conversas das adoções aprovadas." },
    ],
  }),
  component: Page,
});

function Page() {
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
          <Select value={status} onValueChange={(v) => setStatus(v as ConversationStatusFilter)}>
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
          {conversasQuery.data!.conversations.map((c) => (
            <li key={c.id}>
              <Link
                to="/dashboard/mensagens/$conversaId"
                params={{ conversaId: c.id }}
                className="flex items-center justify-between gap-3 p-4 hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    <span className="truncate">{c.counterparty.label}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      · {c.animal.nome}
                    </span>
                    {c.status === "ARQUIVADA" && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                        {statusConversaAdocaoLabel.ARQUIVADA}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.lastMessage
                      ? `${c.lastMessage.authorIsMe ? "Você: " : ""}${c.lastMessage.textPreview}`
                      : "Sem mensagens ainda"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.updatedAt).toLocaleDateString("pt-BR")}
                  </span>
                  {c.unreadCount > 0 && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
