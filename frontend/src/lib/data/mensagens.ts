import type { StatusConversaAdocao } from "../domain/enums";
import { apiRequest } from "./api";

// ============================================================================
// Issue #58 (T101): adoption chat over /api/conversas/**. Participant scope,
// archived read-only state and the 2000-char limit are enforced by the backend;
// periodic refresh (polling) is enough per the MVP (FR-070).
// ============================================================================

export const MAX_MESSAGE_LENGTH = 2000;

export interface ConversationListItem {
  id: string;
  requestId: string;
  animal: { id: string; nome: string; href: string };
  counterparty: { label: string };
  lastMessage?: {
    textPreview: string;
    sentAt: string;
    authorIsMe: boolean;
  };
  status: StatusConversaAdocao;
  unreadCount: number;
  href: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  text: string;
  sentAt: string;
  authorIsMe: boolean;
}

export interface ConversationDetail {
  id: string;
  requestId: string;
  animal: { id: string; nome: string; href: string };
  counterparty: { label: string };
  status: StatusConversaAdocao;
  canSend: boolean;
  messages: ConversationMessage[];
}

export type ConversationStatusFilter = "ativas" | "arquivadas" | "todas";

export async function fetchConversas(
  status?: ConversationStatusFilter,
): Promise<{ conversations: ConversationListItem[]; unreadCount: number }> {
  const query = status && status !== "todas" ? `?status=${status}` : "";
  return apiRequest<{ conversations: ConversationListItem[]; unreadCount: number }>(
    `/api/conversas${query}`,
    { method: "GET" },
  );
}

export async function fetchUnreadCount(): Promise<number> {
  const data = await fetchConversas();
  return data.unreadCount;
}

export async function fetchConversa(id: string): Promise<ConversationDetail> {
  const data = await apiRequest<{ conversation: ConversationDetail }>(`/api/conversas/${id}`, {
    method: "GET",
  });
  return data.conversation;
}

export async function enviarMensagem(id: string, texto: string): Promise<void> {
  await apiRequest(`/api/conversas/${id}/mensagens`, {
    method: "POST",
    json: { texto },
  });
}

export async function marcarConversaLida(id: string): Promise<void> {
  await apiRequest(`/api/conversas/${id}/leitura`, { method: "PATCH" });
}
