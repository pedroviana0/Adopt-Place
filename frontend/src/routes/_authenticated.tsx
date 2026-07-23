import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSessao } from "@/lib/data/sessao";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;
    const s = getSessao();
    if (!s) {
      throw redirect({ to: "/login", search: { next: location.pathname } });
    }
  },
  component: () => <Outlet />,
});
