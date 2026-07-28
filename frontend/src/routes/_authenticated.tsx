import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { ensureSessaoLoaded } from "@/lib/data/sessao";

export const Route = createFileRoute("/_authenticated")({
  // Guard against the real session contract (AUTH-SESSION-01 / GET /api/session).
  // SSR is skipped here (server-side cookie forwarding is out of this Issue's
  // scope; the F1 SSR-flash defect stays tracked under ROUTES-01/T033). On the
  // client the guard awaits the real session before allowing the protected tree.
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const s = await ensureSessaoLoaded();
    if (!s) {
      throw redirect({ to: "/login", search: { next: location.pathname } });
    }
  },
  component: () => <Outlet />,
});
