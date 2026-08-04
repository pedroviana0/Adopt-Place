import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessao } from "@/lib/data/hooks";
import { fetchAdminUsuarios, setUsuarioAtivo } from "@/lib/data/usuarios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/admin/usuarios")({
  component: Page,
});

const perfilLabel: Record<string, string> = {
  ADOTANTE: "Adotante",
  ORGANIZACAO: "Organização",
  ACOLHEDOR: "Acolhedor",
  ADMIN: "Admin",
};

function Page() {
  const s = useSessao();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);

  const usuariosQuery = useQuery({
    queryKey: ["admin-usuarios"],
    queryFn: fetchAdminUsuarios,
    enabled: s?.tipoPerfil === "ADMIN",
  });

  if (!s || s.tipoPerfil !== "ADMIN") {
    return <div className="text-muted-foreground">Área restrita ao administrador.</div>;
  }

  const toggle = async (id: string, ativoAtual: boolean) => {
    setPending(id);
    try {
      await setUsuarioAtivo(id, !ativoAtual);
      await queryClient.invalidateQueries({ queryKey: ["admin-usuarios"] });
      toast.success(ativoAtual ? "Conta desativada" : "Conta reativada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setPending(null);
    }
  };

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Administração de usuários</h1>
      {usuariosQuery.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Carregando…</p>
      ) : usuariosQuery.isError ? (
        <p className="mt-6 text-sm text-destructive">
          {usuariosQuery.error instanceof Error
            ? usuariosQuery.error.message
            : "Não foi possível carregar os usuários."}
        </p>
      ) : (usuariosQuery.data?.length ?? 0) === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Nenhum usuário.</p>
      ) : (
        <ul className="mt-6 divide-y rounded-xl border bg-card">
          {usuariosQuery.data!.map((u) => {
            const busy = pending === u.id;
            return (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{u.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {perfilLabel[u.tipoPerfil] ?? u.tipoPerfil} · desde{" "}
                    {new Date(u.criadoEm).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {u.ativo ? <Badge>Ativa</Badge> : <Badge variant="destructive">Desativada</Badge>}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => toggle(u.id, u.ativo)}
                  >
                    {busy ? "..." : u.ativo ? "Desativar" : "Reativar"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
