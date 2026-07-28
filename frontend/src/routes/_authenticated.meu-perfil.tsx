import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchPerfil, fetchTriagem } from "@/lib/data/usuarios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/meu-perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — AdoptPlace" },
      { name: "description", content: "Seus dados de adotante." },
    ],
  }),
  component: Page,
});

function Page() {
  const perfil = useQuery({ queryKey: ["perfil"], queryFn: fetchPerfil });
  const triagem = useQuery({ queryKey: ["triagem"], queryFn: fetchTriagem });

  if (perfil.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-sm text-muted-foreground">Carregando…</div>
    );
  }
  if (perfil.isError || !perfil.data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-sm text-muted-foreground">
        Não foi possível carregar seu perfil.
      </div>
    );
  }

  const p = perfil.data;
  const concluida = triagem.data?.triagemConcluida === true;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold">Meu perfil</h1>
      <Card className="mt-6">
        <CardContent className="space-y-2 p-6 text-sm">
          <p>
            <span className="text-muted-foreground">Nome:</span> {p.nomeCompleto ?? p.email}
          </p>
          <p>
            <span className="text-muted-foreground">E-mail:</span> {p.email}
          </p>
          {p.cpf && (
            <p>
              <span className="text-muted-foreground">CPF:</span> {p.cpf}
            </p>
          )}
          {p.telefone && (
            <p>
              <span className="text-muted-foreground">Telefone:</span> {p.telefone}
            </p>
          )}
          {p.endereco && (
            <p>
              <span className="text-muted-foreground">Endereço:</span> {p.endereco}, {p.cidade}/
              {p.estado}
            </p>
          )}
          {!triagem.isLoading && (
            <p className="pt-2">
              Triagem:{" "}
              {concluida ? <Badge>Concluída</Badge> : <Badge variant="destructive">Pendente</Badge>}
              <Link to="/triagem" className="ml-2 text-xs text-primary underline">
                {concluida ? "Editar" : "Preencher"}
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
