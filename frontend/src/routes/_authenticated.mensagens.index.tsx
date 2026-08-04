import { createFileRoute } from "@tanstack/react-router";
import { ConversationListPage } from "@/components/app/messages/ConversationListPage";

export const Route = createFileRoute("/_authenticated/mensagens/")({
  head: () => ({
    meta: [
      { title: "Mensagens — AdoptPlace" },
      { name: "description", content: "Conversas das suas adoções aprovadas." },
    ],
  }),
  component: () => <ConversationListPage audience="adopter" />,
});
