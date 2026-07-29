import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AnimalForm } from "@/components/app/AnimalForm";
import { useSessao } from "@/lib/data/hooks";

export const Route = createFileRoute("/_authenticated/dashboard/animais/novo")({
  head: () => ({
    meta: [
      { title: "Novo animal — AdoptPlace" },
      { name: "description", content: "Cadastre um novo animal para adoção." },
    ],
  }),
  component: Page,
});

function Page() {
  const s = useSessao();
  const navigate = useNavigate();
  useEffect(() => {
    if (s && s.tipoPerfil !== "ORGANIZACAO" && s.tipoPerfil !== "ACOLHEDOR") {
      navigate({ to: "/dashboard" });
    }
  }, [s, navigate]);
  if (!s || (s.tipoPerfil !== "ORGANIZACAO" && s.tipoPerfil !== "ACOLHEDOR")) return null;
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Novo animal</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Preencha os dados abaixo. Depois de cadastrar, você poderá adicionar fotos e vínculos.
      </p>
      <div className="mt-6">
        <AnimalForm mode="create" />
      </div>
    </div>
  );
}
