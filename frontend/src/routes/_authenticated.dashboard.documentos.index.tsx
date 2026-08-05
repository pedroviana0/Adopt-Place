import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchDocumentos,
  excluirDocumento,
  uploadDocumento,
  validateDocumentFile,
  type HealthDocument,
} from "@/lib/data/documentos";
import { fetchAnimaisGerenciados } from "@/lib/data/animais";
import { TipoDocumentoSaude, tipoDocumentoSaudeLabel } from "@/lib/domain/enums";
import { AsyncState } from "@/components/app/AsyncState";
import { ConfirmDestructiveAction } from "@/components/app/ConfirmDestructiveAction";

export const Route = createFileRoute("/_authenticated/dashboard/documentos/")({
  head: () => ({
    meta: [
      { title: "Documentos de saúde — AdoptPlace" },
      { name: "description", content: "Documentos internos de saúde dos seus animais." },
    ],
  }),
  component: Page,
});

const TIPOS = Object.values(TipoDocumentoSaude);

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Page() {
  const queryClient = useQueryClient();
  const [filtroTipo, setFiltroTipo] = useState<string>("TODOS");

  const animaisQuery = useQuery({
    queryKey: ["animais-picker"],
    queryFn: () => fetchAnimaisGerenciados(),
  });
  const documentosQuery = useQuery({
    queryKey: ["documentos", filtroTipo],
    queryFn: () =>
      fetchDocumentos(filtroTipo === "TODOS" ? {} : { tipo: filtroTipo as HealthDocument["tipo"] }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["documentos"] });

  return (
    <div className="min-w-0">
      <h1 className="font-serif text-3xl font-semibold">Documentos de saúde</h1>
      <p className="text-sm text-muted-foreground">
        Documentos internos dos seus animais. Não aparecem em perfis públicos.
      </p>

      <div className="mt-6">
        <UploadForm animals={animaisQuery.data ?? []} onUploaded={invalidate} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold">Documentos</h2>
        <div className="w-52">
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger aria-label="Filtrar documentos por tipo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os tipos</SelectItem>
              {TIPOS.map((t) => (
                <SelectItem key={t} value={t}>
                  {tipoDocumentoSaudeLabel[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <AsyncState
        isLoading={documentosQuery.isLoading}
        isError={documentosQuery.isError}
        error={documentosQuery.error}
        onRetry={() => documentosQuery.refetch()}
        isEmpty={
          !documentosQuery.isLoading &&
          !documentosQuery.isError &&
          (documentosQuery.data?.length ?? 0) === 0
        }
        emptyState={{
          title: "Nenhum documento",
          description:
            filtroTipo === "TODOS"
              ? "Envie o primeiro documento de saúde usando o formulário acima."
              : "Não há documentos deste tipo. Selecione outro filtro.",
        }}
        className="mt-4"
      >
        <ul className="mt-4 divide-y rounded-xl border bg-card">
          {documentosQuery.data!.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} onDeleted={invalidate} />
          ))}
        </ul>
      </AsyncState>
    </div>
  );
}

function DocumentRow({ doc, onDeleted }: { doc: HealthDocument; onDeleted: () => void }) {
  const onDelete = async () => {
    try {
      await excluirDocumento(doc.id);
      onDeleted();
      toast.success("Documento excluído");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro";
      toast.error(message);
      throw new Error(message);
    }
  };
  return (
    <li className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate font-medium">{doc.nomeArquivo}</p>
          <p className="text-xs text-muted-foreground">
            {tipoDocumentoSaudeLabel[doc.tipo]} ·{" "}
            <Link
              to="/dashboard/animais/$animalId"
              params={{ animalId: doc.animalId }}
              className="hover:underline"
            >
              {doc.animal.nome}
            </Link>{" "}
            · {fmtSize(doc.tamanhoBytes)} · {new Date(doc.criadoEm).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1">
        <Button asChild size="sm" variant="outline">
          <a href={doc.openHref} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-1 h-4 w-4" />
            Abrir
          </a>
        </Button>
        <ConfirmDestructiveAction
          title="Excluir este documento?"
          item={doc.nomeArquivo}
          consequence="O arquivo será excluído, mas o registro de saúde associado será preservado."
          confirmLabel="Excluir documento"
          onConfirm={onDelete}
          trigger={
            <Button
              size="icon"
              variant="ghost"
              aria-label="Excluir documento"
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          }
        />
      </div>
    </li>
  );
}

function UploadForm({
  animals,
  onUploaded,
}: {
  animals: { id: string; nome: string }[];
  onUploaded: () => void;
}) {
  const [animalId, setAnimalId] = useState("");
  const [tipo, setTipo] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!animalId) {
      toast.error("Selecione o animal");
      return;
    }
    if (!tipo) {
      toast.error("Selecione o tipo de documento");
      return;
    }
    if (!file) {
      toast.error("Selecione o arquivo");
      return;
    }
    try {
      validateDocumentFile(file);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Arquivo inválido");
      return;
    }
    setBusy(true);
    try {
      await uploadDocumento({ animalId, tipoDocumento: tipo as HealthDocument["tipo"], file });
      onUploaded();
      toast.success("Documento enviado");
      setAnimalId("");
      setTipo("");
      setFile(null);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border bg-muted/30 p-4">
      <p className="mb-3 text-sm font-medium">Enviar documento (imagem ou PDF, até 10 MB)</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="document-animal" className="mb-1 block text-xs">
            Animal
          </Label>
          <Select value={animalId} onValueChange={setAnimalId}>
            <SelectTrigger id="document-animal">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {animals.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="document-type" className="mb-1 block text-xs">
            Tipo
          </Label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger id="document-type">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS.map((t) => (
                <SelectItem key={t} value={t}>
                  {tipoDocumentoSaudeLabel[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="doc-file" className="mb-1 block text-xs">
            Arquivo
          </Label>
          <Input
            id="doc-file"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>
      <div className="mt-3">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Enviando…" : "Enviar documento"}
        </Button>
      </div>
    </form>
  );
}
