import { NextResponse } from "next/server";

import { chatApiError, requireActiveChatParticipant } from "@/lib/api/chat-http";
import {
  getConversationList,
  getUnreadMessageCount,
} from "@/lib/queries/mensagens";
import { conversationFilterSchema } from "@/lib/schemas/dashboard-filters";

export async function GET(request: Request) {
  const current = await requireActiveChatParticipant();
  if ("response" in current) return current.response;

  const parsed = conversationFilterSchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return chatApiError(400, "VALIDATION_ERROR", "Filtros invalidos");
  }

  const [conversations, unreadCount] = await Promise.all([
    getConversationList(parsed.data),
    getUnreadMessageCount(),
  ]);
  return NextResponse.json({ conversations, unreadCount });
}
