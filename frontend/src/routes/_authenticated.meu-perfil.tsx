import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3 } from "lucide-react";
import { fetchPerfil, fetchTriagem } from "@/lib/data/usuarios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AsyncState } from "@/components/app/AsyncState";

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

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-10">
      <h1 className="font-serif text-3xl font-semibold">Meu perfil</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Confira os dados usados nas suas jornadas de adoção.
      </p>

      <AsyncState
        isLoading={perfil.isLoading}
        isError={perfil.isError || (!perfil.isLoading && !perfil.data)}
        error={perfil.error}
        errorTitle="Não foi possível carregar seu perfil"
        onRetry={() => perfil.refetch()}
      >
        {perfil.data && (
          <Card className="mt-6 overflow-hidden">
            <CardHeader className="border-b border-border bg-surface-subtle/60">
              <CardTitle className="font-serif text-xl">Dados pessoais</CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <ProfileItem label="Nome" value={perfil.data.nomeCompleto ?? perfil.data.email} />
                <ProfileItem label="E-mail" value={perfil.data.email} />
                {perfil.data.cpf && <ProfileItem label="CPF" value={perfil.data.cpf} />}
                {perfil.data.telefone && (
                  <ProfileItem label="Telefone" value={perfil.data.telefone} />
                )}
                {perfil.data.endereco && (
                  <ProfileItem
                    label="Endereço"
                    value={`${perfil.data.endereco}, ${perfil.data.cidade}/${perfil.data.estado}`}
                    wide
                  />
                )}
              </dl>

              <div className="mt-6 flex flex-col gap-3 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Triagem de adotante
                  </p>
                  {triagem.isLoading ? (
                    <p role="status" className="mt-1 text-sm text-muted-foreground">
                      Verificando situação…
                    </p>
                  ) : triagem.data?.triagemConcluida === true ? (
                    <Badge className="mt-2 gap-1 bg-success text-success-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Concluída
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="mt-2 gap-1">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> Pendente
                    </Badge>
                  )}
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/triagem">
                    {triagem.data?.triagemConcluida === true
                      ? "Revisar triagem"
                      : "Preencher triagem"}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </AsyncState>
    </div>
  );
}

function ProfileItem({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "min-w-0 sm:col-span-2" : "min-w-0"}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words font-medium text-foreground">{value}</dd>
    </div>
  );
}
