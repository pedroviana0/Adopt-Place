"use client";

import { Send } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { Badge, Button, Textarea } from "@/components/ui";
import { sendMensagem } from "@/lib/actions/mensagens";
import type { ConversationDetail as ConversationDetailData } from "@/lib/queries/mensagens";
import { mensagemSchema } from "@/lib/schemas/mensagem";

type Message = ConversationDetailData["messages"][number];

export function ConversationDetail({ detail, currentUserId }: { detail: ConversationDetailData; currentUserId: string }) {
  const [messages, setMessages] = useState(detail.messages);
  const [status, setStatus] = useState(detail.status);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const latestRef = useRef(messages.at(-1)?.sentAt);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const after = latestRef.current?.toISOString();
      const response = await fetch(`/api/mensagens/${detail.id}${after ? `?after=${encodeURIComponent(after)}` : ""}`);
      if (!response.ok) return;
      const payload = await response.json() as { status: "ATIVA" | "ARQUIVADA"; messages: Array<{ id: string; texto: string; criadaEm: string; autorUsuarioId: string }> };
      setStatus(payload.status);
      if (payload.messages.length === 0) return;
      setMessages((current) => {
        const known = new Set(current.map((message) => message.id));
        const incoming: Message[] = payload.messages.filter((message) => !known.has(message.id)).map((message) => ({ id: message.id, text: message.texto, sentAt: new Date(message.criadaEm), authorIsMe: message.autorUsuarioId === currentUserId }));
        const next = [...current, ...incoming];
        latestRef.current = next.at(-1)?.sentAt;
        return next;
      });
    }, 5000);
    return () => window.clearInterval(interval);
  }, [currentUserId, detail.id]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = mensagemSchema.safeParse({ texto: text });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Mensagem invalida.");
    startTransition(async () => {
      const result = await sendMensagem(detail.id, parsed.data);
      if (result.error) return setError(result.error);
      setText(""); setError(null);
    });
  }

  return <div className="space-y-4">
    <div className="flex items-center justify-between border-b pb-3"><div><h1 className="text-xl font-semibold">{detail.animal.nome}</h1><p className="text-sm text-[var(--muted-foreground)]">{detail.counterparty.label}</p></div><Badge variant={status === "ATIVA" ? "outline" : "secondary"}>{status === "ATIVA" ? "Ativa" : "Arquivada"}</Badge></div>
    <ol className="flex min-h-72 flex-col gap-2" aria-live="polite">{messages.map((message) => <li key={message.id} className={`max-w-[85%] rounded-md border px-3 py-2 text-sm ${message.authorIsMe ? "ml-auto bg-[var(--primary)] text-[var(--primary-foreground)]" : "mr-auto bg-white"}`}><p className="whitespace-pre-wrap break-words">{message.text}</p><time className="mt-1 block text-right text-xs opacity-70" dateTime={message.sentAt.toISOString()}>{message.sentAt.toLocaleString("pt-BR")}</time></li>)}</ol>
    {status === "ATIVA" ? <form onSubmit={submit} className="space-y-2 border-t pt-4"><label className="sr-only" htmlFor="message-text">Mensagem</label><Textarea id="message-text" maxLength={2000} value={text} onChange={(event) => setText(event.target.value)} placeholder="Escreva uma mensagem" />{error ? <p role="alert" className="text-sm text-[var(--destructive)]">{error}</p> : null}<div className="flex justify-end"><Button type="submit" disabled={isPending}><Send className="mr-2 size-4" />Enviar</Button></div></form> : <p className="border-t pt-4 text-sm text-[var(--muted-foreground)]">Esta conversa esta arquivada e permanece somente para leitura.</p>}
  </div>;
}
