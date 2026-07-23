import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Cadastro — AdoptPlace" },
      { name: "description", content: "Crie sua conta como adotante, organização ou acolhedor." },
      { property: "og:title", content: "Cadastro — AdoptPlace" },
      { property: "og:description", content: "Junte-se ao AdoptPlace e faça parte da rede de adoção responsável." },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <Outlet />,
});
