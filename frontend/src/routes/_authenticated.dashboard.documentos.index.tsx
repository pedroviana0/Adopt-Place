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
    <div>
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
            <SelectTrigger>
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

      {documentosQuery.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>
      ) : documentosQuery.isError ? (
        <p className="mt-4 text-sm text-destructive">
          {documentosQuery.error instanceof Error
            ? documentosQuery.error.message
            : "Não foi possível carregar os documentos."}
        </p>
      ) : (documentosQuery.data?.length ?? 0) === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Nenhum documento.</p>
      ) : (
        <ul className="mt-4 divide-y rounded-xl border bg-card">
          {documentosQuery.data!.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} onDeleted={invalidate} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DocumentRow({ doc, onDeleted }: { doc: HealthDocument; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);
  const onDelete = async () => {
    if (!confirm("Excluir este documento? O registro de saúde associado é preservado.")) return;
    setBusy(true);
    try {
      await excluirDocumento(doc.id);
      onDeleted();
      toast.success("Documento excluído");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  };
  return (
    <li className="flex items-start justify-between gap-3 p-3">
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
      <div className="flex shrink-0 items-center gap-1">
        <Button asChild size="sm" variant="outline">
          <a href={doc.openHref} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-1 h-4 w-4" />
            Abrir
          </a>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Excluir documento"
          disabled={busy}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
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
          <Label className="mb-1 block text-xs">Animal</Label>
          <Select value={animalId} onValueChange={setAnimalId}>
            <SelectTrigger>
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
          <Label className="mb-1 block text-xs">Tipo</Label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger>
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
