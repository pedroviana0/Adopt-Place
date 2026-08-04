import { NextResponse } from "next/server";

import { AuthGuardError } from "@/lib/actions/auth-guards";
import { chatApiError, requireActiveChatParticipant } from "@/lib/api/chat-http";
import { getConversationDetail } from "@/lib/queries/mensagens";
import { idSchema } from "@/lib/schemas/common";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const current = await requireActiveChatParticipant();
  if ("response" in current) return current.response;

  const parsedId = idSchema.safeParse((await context.params).id);
  if (!parsedId.success) {
    return chatApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }

  try {
    return NextResponse.json({
      conversation: await getConversationDetail(parsedId.data),
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return chatApiError(404, "NOT_FOUND", "Conversa nao encontrada");
    }
    throw error;
  }
}
