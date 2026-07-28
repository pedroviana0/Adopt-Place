import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { ensureSessaoLoaded } from "@/lib/data/sessao";
import { useSessao } from "@/lib/data/hooks";

function AuthPending() {
  return (
    <div className="mx-auto grid min-h-[50vh] max-w-6xl place-items-center px-4">
      <p className="text-sm text-muted-foreground">Carregando…</p>
    </div>
  );
}

// T033 (fix of F1): while the real session is still resolving — notably on SSR,
// hard refresh, or a direct URL, where `beforeLoad` is skipped server-side —
// render a loading state instead of the previous blank flash. Authenticated
// users receive a session and see the protected tree; unauthenticated users are
// redirected to /login by `beforeLoad`. This also closes the F2 blank window,
// since protected leaves no longer render before the session exists.
function AuthenticatedLayout() {
  const sessao = useSessao();
  if (!sessao) return <AuthPending />;
  return <Outlet />;
}

export const Route = createFileRoute("/_authenticated")({
  // Guard against the real session contract (AUTH-SESSION-01 / GET /api/session).
  // SSR is skipped here (server-side cookie forwarding is out of scope); the
  // client-side loading gate above prevents the blank first paint.
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const s = await ensureSessaoLoaded();
    if (!s) {
      throw redirect({ to: "/login", search: { next: location.pathname } });
    }
  },
  component: AuthenticatedLayout,
});
