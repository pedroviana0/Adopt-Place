import { useState, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Pencil, Trash2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { AsyncState } from "@/components/app/AsyncState";
import { ConfirmDestructiveAction } from "@/components/app/ConfirmDestructiveAction";
import { LarTemporarioForm } from "@/components/app/LarTemporarioForm";
import { AnimalImagePlaceholder } from "@/components/app/PublicAnimalCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSessao } from "@/lib/data/hooks";
import { formatarTelefone } from "@/lib/telefone";
import {
  atualizarLarTemporario,
  desvincularAnimalLT,
  excluirLarTemporario,
  fetchLarTemporario,
  fetchVinculaveis,
  vincularAnimalLT,
  type AnimalVinculadoDTO,
} from "@/lib/data/lares-temporarios";

export const Route = createFileRoute("/_authenticated/dashboard/lares-temporarios/$larId")({
  head: () => ({
    meta: [
      { title: "Lar temporário — AdoptPlace" },
      { name: "description", content: "Dados do lar temporário e animais vinculados." },
    ],
  }),
  component: Page,
});

function Page() {
  const { larId } = Route.useParams();
  const s = useSessao();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState(false);
  const [vinculando, setVinculando] = useState(false);
  const isOrganizacao = s?.tipoPerfil === "ORGANIZACAO";

  const lar = useQuery({
    queryKey: ["lar-temporario", larId],
    queryFn: () => fetchLarTemporario(larId),
    enabled: isOrganizacao,
  });

  // Vincular/desvincular muda a lista, o detalhe, os animais e os cards.
  const invalidar = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["lar-temporario", larId] }),
      queryClient.invalidateQueries({ queryKey: ["lares-temporarios"] }),
      queryClient.invalidateQueries({ queryKey: ["lt-vinculaveis"] }),
      queryClient.invalidateQueries({ queryKey: ["animais-gerenciados"] }),
      queryClient.invalidateQueries({ queryKey: ["operational-dashboard"] }),
    ]);
  };

  if (!s) return null;
  if (!isOrganizacao) {
    return (
      <p className="max-w-prose text-muted-foreground">
        A gestão de lares temporários está disponível só para organizações.
      </p>
    );
  }

  if (lar.isLoading || lar.isError || !lar.data) {
    return (
      <AsyncState
        isLoading={lar.isLoading}
        isError={lar.isError}
        error={lar.error}
        onRetry={() => lar.refetch()}
        isEmpty={!lar.isLoading && !lar.isError && !lar.data}
        emptyState={{
          title: "Lar temporário não encontrado",
          description: "O cadastro pode ter sido excluído.",
          action: { label: "Voltar aos lares temporários", to: "/dashboard/lares-temporarios" },
        }}
      >
        <span />
      </AsyncState>
    );
  }

  const lt = lar.data;

  const excluir = async () => {
    try {
      await excluirLarTemporario(lt.id);
      await invalidar();
      toast.success("Lar temporário excluído");
      navigate({ to: "/dashboard/lares-temporarios" });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao excluir";
      toast.error(message);
      throw new Error(message);
    }
  };

  const desvincular = async (animal: AnimalVinculadoDTO) => {
    try {
      await desvincularAnimalLT(lt.id, animal.id);
      await invalidar();
      toast.success(`${animal.nome} desvinculado`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao desvincular";
      toast.error(message);
      throw new Error(message);
    }
  };

  const nomesVinculados = lt.animais.map((a) => a.nome).join(", ");

  return (
    <div className="min-w-0">
      <Link
        to="/dashboard/lares-temporarios"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Lares temporários
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">{lt.nomeTutor}</h1>
        <div className="flex flex-wrap gap-2">
          {/* Dialogs com DialogTrigger: ao fechar, o foco volta ao botao (H13). */}
          <Dialog open={editando} onOpenChange={setEditando}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Pencil className="h-4 w-4" aria-hidden="true" /> Editar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90dvh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar lar temporário</DialogTitle>
                <DialogDescription>
                  Os dados ficam visíveis só para a sua organização.
                </DialogDescription>
              </DialogHeader>
              <LarTemporarioForm
                mode="edit"
                defaultValues={{
                  nomeTutor: lt.nomeTutor,
                  telefone: lt.telefone,
                  endereco: lt.endereco,
                  cidade: lt.cidade,
                  observacoes: lt.observacoes ?? "",
                }}
                submitLabel="Salvar alterações"
                onCancel={() => setEditando(false)}
                onSubmit={async (values) => {
                  await atualizarLarTemporario(lt.id, values);
                  await invalidar();
                  toast.success("Lar temporário atualizado");
                  setEditando(false);
                }}
              />
            </DialogContent>
          </Dialog>
          <ConfirmDestructiveAction
            title="Excluir este lar temporário?"
            item={lt.nomeTutor}
            consequence={
              lt.animais.length > 0
                ? `Os dados do tutor serão apagados. ${lt.animais.length === 1 ? "O animal" : "Os animais"} ${nomesVinculados} ${lt.animais.length === 1 ? "continuará" : "continuarão"} marcado(s) como "Em LT · sem registro". Esta ação não pode ser desfeita.`
                : "Os dados do tutor serão apagados. Esta ação não pode ser desfeita."
            }
            confirmLabel="Excluir LT"
            onConfirm={excluir}
            trigger={
              <Button variant="outline" size="sm" className="gap-2 text-destructive">
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Excluir
              </Button>
            }
          />
        </div>
      </div>

      <dl className="mt-6 grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
        <Dado rotulo="Telefone" valor={formatarTelefone(lt.telefone)} />
        <Dado rotulo="Cidade" valor={lt.cidade} />
        <Dado rotulo="Endereço" valor={lt.endereco} className="sm:col-span-2" />
        {lt.observacoes && (
          <Dado rotulo="Observações" valor={lt.observacoes} className="sm:col-span-2" />
        )}
      </dl>

      <section className="mt-8" aria-labelledby="lt-animais-titulo">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="lt-animais-titulo" className="font-serif text-xl font-semibold">
            Animais neste LT
          </h2>
          <VincularDialog
            open={vinculando}
            onOpenChange={setVinculando}
            trigger={
              <Button size="sm" className="gap-2">
                <Link2 className="h-4 w-4" aria-hidden="true" /> Vincular animal
              </Button>
            }
            onVincular={async (animal) => {
              try {
                await vincularAnimalLT(lt.id, animal.id);
                await invalidar();
                toast.success(`${animal.nome} vinculado a ${lt.nomeTutor}`);
                setVinculando(false);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Erro ao vincular");
                await invalidar();
              }
            }}
          />
        </div>
        {lt.animais.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nenhum animal vinculado.</p>
        ) : (
          <ul className="mt-3 divide-y rounded-xl border bg-card">
            {lt.animais.map((animal) => (
              <li key={animal.id} className="flex flex-wrap items-center gap-3 p-3">
                <FotoAnimal animal={animal} />
                <div className="min-w-0 flex-1">
                  <Link
                    to="/dashboard/animais/$animalId"
                    params={{ animalId: animal.id }}
                    className="font-medium hover:underline"
                  >
                    {animal.nome}
                  </Link>
                  <div className="mt-1">
                    <StatusBadge status={animal.status} />
                  </div>
                </div>
                <ConfirmDestructiveAction
                  title="Desvincular este animal?"
                  item={animal.nome}
                  consequence={`${animal.nome} continuará marcado como "Em LT", mas sem lar temporário registrado.`}
                  confirmLabel="Desvincular"
                  confirmVariant="default"
                  onConfirm={() => desvincular(animal)}
                  trigger={
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Unlink className="h-4 w-4" aria-hidden="true" /> Desvincular
                    </Button>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
}

// So aparecem animais da ONG marcados "Em LT" e ainda sem LT (RF-024).
function VincularDialog({
  open,
  onOpenChange,
  trigger,
  onVincular,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  onVincular: (animal: AnimalVinculadoDTO) => Promise<void>;
}) {
  const [pendente, setPendente] = useState<string | null>(null);
  const candidatos = useQuery({
    queryKey: ["lt-vinculaveis"],
    queryFn: fetchVinculaveis,
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !pendente && onOpenChange(next)}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vincular animal</DialogTitle>
          <DialogDescription>
            Aparecem só os animais marcados como "Em LT" que ainda não têm lar temporário
            registrado.
          </DialogDescription>
        </DialogHeader>
        <AsyncState
          className="mt-2"
          isLoading={candidatos.isLoading}
          isError={candidatos.isError}
          error={candidatos.error}
          onRetry={() => candidatos.refetch()}
          isEmpty={!candidatos.isLoading && !candidatos.isError && (candidatos.data ?? []).length === 0}
          emptyState={{
            title: "Nenhum animal para vincular",
            description:
              'Marque o animal como "Em LT" no formulário dele para que apareça aqui.',
          }}
        >
          <ul className="divide-y rounded-xl border">
            {(candidatos.data ?? []).map((animal) => (
              <li key={animal.id} className="flex items-center gap-3 p-3">
                <FotoAnimal animal={animal} />
                <span className="min-w-0 flex-1 truncate font-medium">{animal.nome}</span>
                <Button
                  size="sm"
                  disabled={pendente !== null}
                  onClick={async () => {
                    setPendente(animal.id);
                    try {
                      await onVincular(animal);
                    } finally {
                      setPendente(null);
                    }
                  }}
                >
                  {pendente === animal.id ? "Vinculando..." : "Vincular"}
                </Button>
              </li>
            ))}
          </ul>
        </AsyncState>
      </DialogContent>
    </Dialog>
  );
}

function FotoAnimal({ animal }: { animal: AnimalVinculadoDTO }) {
  return animal.fotoPrincipal ? (
    <img
      src={animal.fotoPrincipal.urlFoto}
      alt={`Foto de ${animal.nome}`}
      className="h-12 w-12 rounded-md object-cover"
    />
  ) : (
    <AnimalImagePlaceholder animalName={animal.nome} className="h-12 w-12 rounded-md" />
  );
}

function Dado({ rotulo, valor, className }: { rotulo: string; valor: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className="mt-0.5 break-words">{valor}</dd>
    </div>
  );
}
