import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  fetchNotificacoes,
  marcarNotificacoesLidas,
  type NotificacaoDTO,
} from "@/lib/data/notificacoes";

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ontem";
  return `${dias} dias`;
}

export function NotificationBell() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notificacoes"],
    queryFn: fetchNotificacoes,
    refetchInterval: 30_000,
  });
  const marcarLidas = useMutation({
    mutationFn: marcarNotificacoesLidas,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificacoes"] }),
  });

  const itens: NotificacaoDTO[] = query.data?.notifications ?? [];
  const unread = query.data?.unread ?? 0;

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && unread > 0) marcarLidas.mutate();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread > 0 ? `Avisos: ${unread} não lidos` : "Avisos"}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Avisos</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {itens.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Nada por aqui ainda. Avisamos você quando algo acontecer.
          </p>
        ) : (
          itens.map((n) => {
            const conteudo = (
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {!n.lida && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                      aria-hidden="true"
                    />
                  )}
                  {n.titulo}
                </span>
                <span className="text-xs leading-snug text-muted-foreground">{n.mensagem}</span>
                <span className="text-xs text-muted-foreground/80">{tempoRelativo(n.criadoEm)}</span>
              </div>
            );
            return (
              <DropdownMenuItem key={n.id} asChild className="items-start whitespace-normal py-2">
                {n.href ? <Link to={n.href}>{conteudo}</Link> : <div>{conteudo}</div>}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
