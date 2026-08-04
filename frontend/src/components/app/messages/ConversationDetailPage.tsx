import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  enviarMensagem,
  fetchConversa,
  marcarConversaLida,
  MAX_MESSAGE_LENGTH,
} from "@/lib/data/mensagens";

interface ConversationDetailPageProps {
  audience: "adopter" | "responsible";
  conversationId: string;
}

export function ConversationDetailPage({ audience, conversationId }: ConversationDetailPageProps) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const conversationQuery = useQuery({
    queryKey: ["conversa", conversationId],
    queryFn: () => fetchConversa(conversationId),
    refetchInterval: 15_000,
  });
  const messagesCount = conversationQuery.data?.messages.length ?? 0;

  useEffect(() => {
    if (!conversationQuery.data) return;
    marcarConversaLida(conversationId)
      .then(async () => {
        await queryClient.invalidateQueries({ queryKey: ["conversas"] });
        await queryClient.invalidateQueries({ queryKey: ["mensagens-unread"] });
      })
      .catch(() => {});
  }, [conversationId, messagesCount, conversationQuery.data, queryClient]);

  if (conversationQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }
  if (conversationQuery.isError || !conversationQuery.data) {
    return <div className="text-muted-foreground">Conversa não encontrada.</div>;
  }

  const conversation = conversationQuery.data;
  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      toast.error(`A mensagem deve ter no máximo ${MAX_MESSAGE_LENGTH} caracteres.`);
      return;
    }
    setSending(true);
    try {
      await enviarMensagem(conversationId, trimmed);
      setText("");
      await conversationQuery.refetch();
      await queryClient.invalidateQueries({ queryKey: ["conversas"] });
      await queryClient.invalidateQueries({ queryKey: ["mensagens-unread"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[70vh] flex-col">
      <div className="flex items-center gap-3 border-b pb-3">
        {audience === "adopter" ? (
          <Link to="/mensagens" className="text-sm text-muted-foreground hover:text-foreground">
            ←
          </Link>
        ) : (
          <Link
            to="/dashboard/mensagens"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ←
          </Link>
        )}
        <div className="min-w-0">
          <p className="truncate font-serif text-lg font-semibold">
            {conversation.counterparty.label}
          </p>
          <p className="text-xs text-muted-foreground">
            Sobre{" "}
            {audience === "adopter" ? (
              <Link
                to="/animais/$animalId"
                params={{ animalId: conversation.animal.id }}
                className="hover:underline"
              >
                {conversation.animal.nome}
              </Link>
            ) : (
              <Link
                to="/dashboard/animais/$animalId"
                params={{ animalId: conversation.animal.id }}
                className="hover:underline"
              >
                {conversation.animal.nome}
              </Link>
            )}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto py-4">
        {conversation.messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
        ) : (
          conversation.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.authorIsMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  message.authorIsMe ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
                <p
                  className={`mt-1 text-[10px] ${
                    message.authorIsMe ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {new Date(message.sentAt).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {conversation.canSend ? (
        <form onSubmit={send} className="flex items-end gap-2 border-t pt-3">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={2}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder="Escreva uma mensagem…"
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !text.trim()}>
            {sending ? "…" : "Enviar"}
          </Button>
        </form>
      ) : (
        <p className="border-t pt-3 text-center text-sm text-muted-foreground">
          Esta conversa está arquivada. O histórico permanece visível, mas novos envios estão
          bloqueados.
        </p>
      )}
    </div>
  );
}
