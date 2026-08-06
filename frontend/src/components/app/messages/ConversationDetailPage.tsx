import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AsyncState } from "@/components/app/AsyncState";
import { Archive, ArrowLeft } from "lucide-react";
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
    return (
      <AsyncState isLoading loadingLabel="Carregando conversa…">
        {null}
      </AsyncState>
    );
  }
  if (conversationQuery.isError || !conversationQuery.data) {
    return (
      <AsyncState
        isLoading={false}
        isError
        error={conversationQuery.error}
        errorTitle="Conversa não encontrada"
        errorFallback="A conversa pode não estar mais disponível para este perfil."
        onRetry={() => conversationQuery.refetch()}
      >
        {null}
      </AsyncState>
    );
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
    <div className="flex min-h-[32rem] max-w-full flex-col sm:h-[70vh]">
      <div className="flex items-center gap-3 border-b pb-3">
        {audience === "adopter" ? (
          <Link
            to="/mensagens"
            aria-label="Voltar para mensagens"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : (
          <Link
            to="/dashboard/mensagens"
            aria-label="Voltar para mensagens"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
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

      <div className="flex-1 space-y-2 overflow-y-auto py-4" aria-live="polite">
        {conversation.messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
        ) : (
          conversation.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.authorIsMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm sm:max-w-[75%] ${
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
        <form
          onSubmit={send}
          className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1">
            <Label htmlFor="conversation-message" className="sr-only">
              Mensagem
            </Label>
            <Textarea
              id="conversation-message"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={2}
              maxLength={MAX_MESSAGE_LENGTH}
              aria-describedby="conversation-message-limit"
              placeholder="Escreva uma mensagem…"
            />
            <p
              id="conversation-message-limit"
              className="mt-1 text-right text-xs text-muted-foreground"
            >
              {text.length}/{MAX_MESSAGE_LENGTH}
            </p>
          </div>
          <Button type="submit" className="sm:mb-5" disabled={sending || !text.trim()}>
            {sending ? "…" : "Enviar"}
          </Button>
        </form>
      ) : (
        <div className="flex items-start gap-2 border-t bg-surface-subtle px-3 py-3 text-sm text-muted-foreground">
          <Archive className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            <strong className="font-medium text-foreground">Conversa arquivada.</strong> O histórico
            permanece visível, mas novos envios estão bloqueados.
          </p>
        </div>
      )}
    </div>
  );
}
