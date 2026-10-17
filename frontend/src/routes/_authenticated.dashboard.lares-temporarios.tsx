import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/lares-temporarios")({
  component: () => <Outlet />,
});
