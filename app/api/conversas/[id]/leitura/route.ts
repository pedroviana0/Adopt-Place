import { NextResponse } from "next/server";

import { markConversationRead } from "@/lib/actions/mensagens";
import {
  chatActionError,
  chatApiError,
  requireActiveChatParticipant,
} from "@/lib/api/chat-http";
import { idSchema } from "@/lib/schemas/common";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, context: RouteContext) {
  const current = await requireActiveChatParticipant();
  if ("response" in current) return current.response;

  const parsedId = idSchema.safeParse((await context.params).id);
  if (!parsedId.success) {
    return chatApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }

  const result = await markConversationRead(parsedId.data);
  if (result.error) return chatActionError(result.error);
  return NextResponse.json({ success: true });
}
