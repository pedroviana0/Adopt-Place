import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessao } from "@/lib/data/hooks";
import { fetchAdminUsuarios, setUsuarioAtivo } from "@/lib/data/usuarios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, CircleOff } from "lucide-react";
import { AsyncState } from "@/components/app/AsyncState";
import { ConfirmDestructiveAction } from "@/components/app/ConfirmDestructiveAction";

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
      const message = e instanceof Error ? e.message : "Erro";
      toast.error(message);
      throw new Error(message);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="min-w-0">
      <h1 className="font-serif text-3xl font-semibold">Administração de usuários</h1>
      <AsyncState
        isLoading={usuariosQuery.isLoading}
        isError={usuariosQuery.isError}
        error={usuariosQuery.error}
        onRetry={() => usuariosQuery.refetch()}
        isEmpty={
          !usuariosQuery.isLoading &&
          !usuariosQuery.isError &&
          (usuariosQuery.data?.length ?? 0) === 0
        }
        emptyState={{
          title: "Nenhum usuário",
          description: "Não há contas disponíveis para administração.",
        }}
      >
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
                <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end">
                  {u.ativo ? (
                    <Badge className="gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Ativa
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <CircleOff className="h-3.5 w-3.5" aria-hidden="true" />
                      Desativada
                    </Badge>
                  )}
                  <ConfirmDestructiveAction
                    title={u.ativo ? "Desativar esta conta?" : "Reativar esta conta?"}
                    item={`${u.email} — ${perfilLabel[u.tipoPerfil] ?? u.tipoPerfil}`}
                    consequence={
                      u.ativo
                        ? "A pessoa perderá acesso até que um administrador reative a conta."
                        : "A pessoa recuperará o acesso permitido pelo perfil atual."
                    }
                    confirmLabel={u.ativo ? "Desativar conta" : "Reativar conta"}
                    confirmVariant={u.ativo ? "destructive" : "default"}
                    disabled={busy}
                    onConfirm={() => toggle(u.id, u.ativo)}
                    trigger={
                      <Button size="sm" variant="outline">
                        {u.ativo ? "Desativar" : "Reativar"}
                      </Button>
                    }
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </AsyncState>
    </div>
  );
}
