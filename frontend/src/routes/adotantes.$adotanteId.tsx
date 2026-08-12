import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { TriagemReadOnly } from "@/components/app/TriagemReadOnly";
import { fetchAdopterProfile } from "@/lib/data/perfis";
import type { OwnerRequestAdotante } from "@/lib/data/solicitacoes";

export const Route = createFileRoute("/adotantes/$adotanteId")({
  head: () => ({ meta: [{ title: "Perfil do adotante — AdoptPlace" }] }),
  component: Page,
});

function Page() {
  const { adotanteId } = Route.useParams();
  const query = useQuery({ queryKey: ["perfil-adotante", adotanteId], queryFn: () => fetchAdopterProfile(adotanteId) });
  if (query.isLoading) return <main className="page-canvas py-10">Carregando…</main>;
  if (query.isError || !query.data) return <main className="page-canvas py-10 text-muted-foreground">Perfil não encontrado.</main>;

  const profile = query.data;
  return (
    <main className="page-canvas space-y-8 py-10">
      <header>
        <p className="text-sm font-medium text-primary">Adotante</p>
        <h1 className="font-serif text-3xl font-semibold">{profile.nome}</h1>
        <p className="text-muted-foreground">{profile.municipio} — {profile.uf}</p>
      </header>
      {profile.access === "PUBLIC" ? (
        <section className="rounded-xl border border-dashed p-5">
          <h2 className="font-serif text-xl font-semibold">Dados privados de análise</h2>
          <p className="mt-1 text-sm text-muted-foreground">Triagem e endereço são visíveis apenas para o próprio adotante, a administração e responsáveis que tenham ou tenham tido uma solicitação desta pessoa.</p>
        </section>
      ) : (
        <>
          <section className="rounded-xl border bg-card p-5">
            <h2 className="font-serif text-xl font-semibold">Endereço para análise</h2>
            <p className="mt-2">{profile.enderecoAnalise.endereco}</p>
            <p className="text-sm text-muted-foreground">{profile.enderecoAnalise.cep ? `${profile.enderecoAnalise.cep} · ` : ""}{profile.enderecoAnalise.cidade}/{profile.enderecoAnalise.estado}</p>
          </section>
          <section>
            <h2 className="mb-3 font-serif text-xl font-semibold">Triagem do adotante</h2>
            <TriagemReadOnly adotante={{ ...profile.triagem, id: profile.id, nomeCompleto: profile.nome, cidade: profile.municipio, estado: profile.uf, triagemConcluida: profile.triagemConcluida } as Omit<OwnerRequestAdotante, "telefone">} />
          </section>
        </>
      )}
    </main>
  );
}
