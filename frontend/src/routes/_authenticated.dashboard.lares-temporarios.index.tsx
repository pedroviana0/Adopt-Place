import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { AsyncState } from "@/components/app/AsyncState";
import { LarTemporarioForm } from "@/components/app/LarTemporarioForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessao } from "@/lib/data/hooks";
import { criarLarTemporario, fetchLaresTemporarios } from "@/lib/data/lares-temporarios";
import { formatarTelefone } from "@/lib/telefone";

export const Route = createFileRoute("/_authenticated/dashboard/lares-temporarios/")({
  head: () => ({
    meta: [
      { title: "Lares temporários — AdoptPlace" },
      { name: "description", content: "Cadastre e organize os lares temporários da organização." },
    ],
  }),
  component: Page,
});

// Busca sem acento e sem caixa (§10 do CLAUDE.md): "jose" encontra "José".
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function Page() {
  const s = useSessao();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [novoAberto, setNovoAberto] = useState(false);
  const isOrganizacao = s?.tipoPerfil === "ORGANIZACAO";

  const lares = useQuery({
    queryKey: ["lares-temporarios"],
    queryFn: fetchLaresTemporarios,
    enabled: isOrganizacao,
  });

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    const lista = lares.data ?? [];
    return termo ? lista.filter((lt) => normalizar(lt.nomeTutor).includes(termo)) : lista;
  }, [lares.data, busca]);

  if (!s) return null;

  // Acolhedor ja e o lar temporario dos proprios animais (D6): explica em vez
  // de redirecionar.
  if (!isOrganizacao) {
    return (
      <div className="min-w-0">
        <h1 className="font-serif text-3xl font-semibold">Lares temporários</h1>
        <p className="mt-4 max-w-prose text-muted-foreground">
          A gestão de lares temporários está disponível só para organizações. Como acolhedor
          independente, você já é o lar temporário dos animais sob seus cuidados.
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Lares temporários</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tutores que acolhem animais da organização até a adoção. Visível só para a sua
            organização.
          </p>
        </div>
        <Dialog open={novoAberto} onOpenChange={setNovoAberto}>
          {/* Trigger do Radix: ao fechar, o foco volta ao botão (H13). */}
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" aria-hidden="true" /> Novo LT
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo lar temporário</DialogTitle>
              <DialogDescription>
                Os dados ficam visíveis só para a sua organização.
              </DialogDescription>
            </DialogHeader>
            <LarTemporarioForm
              mode="create"
              submitLabel="Cadastrar LT"
              onCancel={() => setNovoAberto(false)}
              onSubmit={async (values) => {
                const id = await criarLarTemporario({ ...values, autorizacaoTutor: true });
                await queryClient.invalidateQueries({ queryKey: ["lares-temporarios"] });
                toast.success("Lar temporário cadastrado");
                setNovoAberto(false);
                navigate({ to: "/dashboard/lares-temporarios/$larId", params: { larId: id } });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <label htmlFor="lt-busca" className="mt-4 grid max-w-sm gap-1.5 text-sm font-medium">
        Buscar por nome do tutor
        <Input
          id="lt-busca"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Digite o nome"
        />
      </label>

      <AsyncState
        className="mt-6"
        isLoading={lares.isLoading}
        loadingFallback={<ListaSkeleton />}
        isError={lares.isError}
        error={lares.error}
        onRetry={() => lares.refetch()}
        isEmpty={!lares.isLoading && !lares.isError && filtrados.length === 0}
        emptyState={{
          title: busca ? "Nenhum lar temporário encontrado" : "Nenhum lar temporário cadastrado",
          description: busca
            ? "Confira o nome digitado ou limpe a busca."
            : "Cadastre o primeiro tutor temporário da organização.",
          action: busca
            ? { label: "Limpar busca", onClick: () => setBusca("") }
            : { label: "Cadastrar LT", onClick: () => setNovoAberto(true) },
        }}
      >
        <ul className="mt-6 divide-y rounded-xl border bg-card">
          {filtrados.map((lt) => (
            <li key={lt.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <Link
                  to="/dashboard/lares-temporarios/$larId"
                  params={{ larId: lt.id }}
                  className="font-medium hover:underline"
                >
                  {lt.nomeTutor}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {lt.cidade} · {formatarTelefone(lt.telefone)}
                </p>
              </div>
              <span className="text-sm text-muted-foreground">
                {lt.totalAnimais === 1 ? "1 animal" : `${lt.totalAnimais} animais`}
              </span>
            </li>
          ))}
        </ul>
      </AsyncState>

    </div>
  );
}

function ListaSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between rounded-xl border p-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
