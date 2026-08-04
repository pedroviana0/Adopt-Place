import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useSessao } from "@/lib/data/hooks";

export const Route = createFileRoute("/_authenticated/mensagens")({
  component: MessagesLayout,
});

function MessagesLayout() {
  const session = useSessao();
  if (session?.tipoPerfil !== "ADOTANTE") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-muted-foreground">
        Área exclusiva para adotantes.
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Outlet />
    </div>
  );
}
