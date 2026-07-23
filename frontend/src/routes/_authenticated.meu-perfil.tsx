import { createFileRoute, Link } from "@tanstack/react-router";
import { useSessao, useDbVersion } from "@/lib/data/hooks";
import { getAdotante } from "@/lib/data/usuarios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/meu-perfil")({
  head: () => ({ meta: [{ title: "Meu perfil — AdoptPlace" }, { name: "description", content: "Seus dados de adotante." }] }),
  component: Page,
});

function Page() {
  useDbVersion();
  const s = useSessao();
  if (!s) return null;
  const adot = s.adotanteId ? getAdotante(s.adotanteId) : null;
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold">Meu perfil</h1>
      <Card className="mt-6"><CardContent className="space-y-2 p-6 text-sm">
        <p><span className="text-muted-foreground">Nome:</span> {s.nome}</p>
        <p><span className="text-muted-foreground">E-mail:</span> {s.email}</p>
        {adot && (
          <>
            <p><span className="text-muted-foreground">CPF:</span> {adot.cpf}</p>
            <p><span className="text-muted-foreground">Telefone:</span> {adot.telefone}</p>
            <p><span className="text-muted-foreground">Endereço:</span> {adot.endereco}, {adot.cidade}/{adot.estado}</p>
            <p className="pt-2">Triagem: {adot.triagemConcluida ? <Badge>Concluída</Badge> : <Badge variant="destructive">Pendente</Badge>} <Link to="/triagem" className="ml-2 text-xs text-primary underline">{adot.triagemConcluida ? "Editar" : "Preencher"}</Link></p>
          </>
        )}
      </CardContent></Card>
    </div>
  );
}
