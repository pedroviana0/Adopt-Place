import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchConversa,
  enviarMensagem,
  marcarConversaLida,
  MAX_MESSAGE_LENGTH,
} from "@/lib/data/mensagens";

export const Route = createFileRoute("/_authenticated/dashboard/mensagens/$conversaId")({
  head: () => ({
    meta: [
      { title: "Conversa — AdoptPlace" },
      { name: "description", content: "Conversa da adoção." },
    ],
  }),
  component: Page,
});

function Page() {
  const { conversaId } = Route.useParams();
  const queryClient = useQueryClient();
  const [texto, setTexto] = useState("");
  const [sending, setSending] = useState(false);

  const conversaQuery = useQuery({
    queryKey: ["conversa", conversaId],
    queryFn: () => fetchConversa(conversaId),
    refetchInterval: 15_000,
  });

  const messagesCount = conversaQuery.data?.messages.length ?? 0;

  // Opening (and each new incoming batch) marks visible messages as read.
  useEffect(() => {
    if (!conversaQuery.data) return;
    marcarConversaLida(conversaId)
      .then(() => queryClient.invalidateQueries({ queryKey: ["conversas"] }))
      .catch(() => {});
  }, [conversaId, messagesCount, conversaQuery.data, queryClient]);

  if (conversaQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }
  if (conversaQuery.isError || !conversaQuery.data) {
    return <div className="text-muted-foreground">Conversa não encontrada.</div>;
  }

  const conversa = conversaQuery.data;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = texto.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      toast.error(`A mensagem deve ter no máximo ${MAX_MESSAGE_LENGTH} caracteres.`);
      return;
    }
    setSending(true);
    try {
      await enviarMensagem(conversaId, trimmed);
      setTexto("");
      await conversaQuery.refetch();
      await queryClient.invalidateQueries({ queryKey: ["conversas"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[70vh] flex-col">
      <div className="flex items-center gap-3 border-b pb-3">
        <Link
          to="/dashboard/mensagens"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ←
        </Link>
        <div className="min-w-0">
          <p className="truncate font-serif text-lg font-semibold">{conversa.counterparty.label}</p>
          <p className="text-xs text-muted-foreground">
            Sobre{" "}
            <Link
              to="/dashboard/animais/$animalId"
              params={{ animalId: conversa.animal.id }}
              className="hover:underline"
            >
              {conversa.animal.nome}
            </Link>
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto py-4">
        {conversa.messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
        ) : (
          conversa.messages.map((m) => (
            <div key={m.id} className={`flex ${m.authorIsMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  m.authorIsMe ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p
                  className={`mt-1 text-[10px] ${m.authorIsMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                >
                  {new Date(m.sentAt).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {conversa.canSend ? (
        <form onSubmit={send} className="flex items-end gap-2 border-t pt-3">
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={2}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder="Escreva uma mensagem…"
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !texto.trim()}>
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
