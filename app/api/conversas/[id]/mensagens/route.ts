import { NextResponse } from "next/server";

import { sendMensagem } from "@/lib/actions/mensagens";
import {
  chatActionError,
  chatApiError,
  requireActiveChatParticipant,
} from "@/lib/api/chat-http";
import { idSchema } from "@/lib/schemas/common";
import { mensagemSchema } from "@/lib/schemas/mensagem";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const current = await requireActiveChatParticipant();
  if ("response" in current) return current.response;

  const parsedId = idSchema.safeParse((await context.params).id);
  if (!parsedId.success) {
    return chatApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return chatApiError(400, "INVALID_JSON", "Corpo JSON invalido");
  }
  const parsedBody = mensagemSchema.safeParse(body);
  if (!parsedBody.success) {
    return chatApiError(
      400,
      "VALIDATION_ERROR",
      parsedBody.error.issues[0]?.message ?? "Mensagem invalida",
    );
  }

  const result = await sendMensagem(parsedId.data, parsedBody.data);
  if (result.error) return chatActionError(result.error);
  return NextResponse.json({ success: true });
}
