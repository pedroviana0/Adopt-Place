import { createFileRoute } from "@tanstack/react-router";
import { useDbVersion, useSessao } from "@/lib/data/hooks";
import { listUsuarios, nomeDoUsuario, setAtivo } from "@/lib/data/usuarios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/admin/usuarios")({
  component: Page,
});

const perfilLabel: Record<string, string> = { ADOTANTE: "Adotante", ORGANIZACAO: "Organização", ACOLHEDOR: "Acolhedor", ADMIN: "Admin" };

function Page() {
  useDbVersion();
  const s = useSessao();
  if (!s || s.tipoPerfil !== "ADMIN") return <div className="text-muted-foreground">Área restrita ao administrador.</div>;
  const usuarios = listUsuarios();
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Administração de usuários</h1>
      <ul className="mt-6 divide-y rounded-xl border bg-card">
        {usuarios.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div>
              <p className="font-medium">{nomeDoUsuario(u)}</p>
              <p className="text-xs text-muted-foreground">{u.email} · {perfilLabel[u.tipoPerfil]}</p>
            </div>
            <div className="flex items-center gap-2">
              {u.ativo ? <Badge>Ativa</Badge> : <Badge variant="destructive">Desativada</Badge>}
              <Button size="sm" variant="outline" onClick={() => { setAtivo(u.id, !u.ativo); toast.success(u.ativo ? "Conta desativada" : "Conta reativada"); }}>
                {u.ativo ? "Desativar" : "Reativar"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
