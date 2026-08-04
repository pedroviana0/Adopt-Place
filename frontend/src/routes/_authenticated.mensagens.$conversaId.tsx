import { createFileRoute } from "@tanstack/react-router";
import { ConversationDetailPage } from "@/components/app/messages/ConversationDetailPage";

export const Route = createFileRoute("/_authenticated/mensagens/$conversaId")({
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
  return <ConversationDetailPage audience="adopter" conversationId={conversaId} />;
}
