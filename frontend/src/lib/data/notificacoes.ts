import { apiRequest } from "./api";

export type TipoNotificacao =
  | "SOLICITACAO_RECEBIDA"
  | "SOLICITACAO_APROVADA"
  | "SOLICITACAO_RECUSADA"
  | "ADOCAO_CONCLUIDA";

export interface NotificacaoDTO {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  href: string | null;
  lida: boolean;
  criadoEm: string;
}

export interface NotificacoesResposta {
  notifications: NotificacaoDTO[];
  unread: number;
}

export async function fetchNotificacoes(): Promise<NotificacoesResposta> {
  return apiRequest<NotificacoesResposta>("/api/notificacoes", { method: "GET" });
}

export async function marcarNotificacoesLidas(): Promise<void> {
  await apiRequest("/api/notificacoes", { method: "POST" });
}
