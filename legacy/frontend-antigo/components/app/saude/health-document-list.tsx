"use client";

import { Download, ExternalLink, Trash2, Upload } from "lucide-react";
import { genUploader } from "uploadthing/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Badge, Button, Input, Select } from "@/components/ui";
import { deleteDocumentoSaude } from "@/lib/actions/documentos-saude";
import type { HealthDocument } from "@/lib/queries/documentos-saude";
import { documentoSaudeUploadSchema } from "@/lib/schemas/documento-saude";
import type { UploadRouter } from "@/lib/upload-router";

const { uploadFiles } = genUploader<UploadRouter>();

export function HealthDocumentList({ documents, animals, defaultAnimalId }: { documents: HealthDocument[]; animals: Array<{ id: string; nome: string }>; defaultAnimalId?: string }) {
  const router = useRouter();
  const [animalId, setAnimalId] = useState(defaultAnimalId ?? "");
  const [type, setType] = useState("EXAME");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function upload() {
    if (!file) return setError("Selecione um arquivo.");
    const parsed = documentoSaudeUploadSchema.safeParse({ animalId, tipo: type, nomeArquivo: file.name, mimeType: file.type, tamanhoBytes: file.size });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Arquivo invalido.");
    startTransition(async () => {
      try {
        await uploadFiles("healthDocument", { files: [file], input: { animalId, tipoDocumento: parsed.data.tipo } });
        setFile(null); setError(null); router.refresh();
      } catch { setError("Nao foi possivel enviar o documento."); }
    });
  }

  function remove(id: string) {
    if (!window.confirm("Excluir este documento de saude?")) return;
    startTransition(async () => {
      const result = await deleteDocumentoSaude(id);
      if (result.error) return setError(result.error);
      router.refresh();
    });
  }

  return <div className="space-y-5">
    <div className="grid gap-3 border-y py-4 md:grid-cols-[1fr_1fr_2fr_auto]">
      <Select value={animalId} onChange={(event) => setAnimalId(event.target.value)} aria-label="Animal do documento"><option value="">Selecione o animal</option>{animals.map((animal) => <option key={animal.id} value={animal.id}>{animal.nome}</option>)}</Select>
      <Select value={type} onChange={(event) => setType(event.target.value)} aria-label="Tipo do documento">{["EXAME", "RECEITA", "LAUDO", "COMPROVANTE_VACINACAO", "OUTRO"].map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</Select>
      <Input type="file" accept="image/*,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
      <Button onClick={upload} disabled={isPending}><Upload className="mr-2 size-4" />Enviar</Button>
    </div>
    {error ? <p role="alert" className="text-sm text-[var(--destructive)]">{error}</p> : null}
    {documents.length === 0 ? <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">Nenhum documento anexado.</p> : <ul className="divide-y rounded-md border">{documents.map((document) => <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div className="min-w-0"><p className="truncate text-sm font-medium">{document.nomeArquivo}</p><p className="text-xs text-[var(--muted-foreground)]">{document.animal.nome} | {(document.tamanhoBytes / 1024).toFixed(1)} KB | {document.criadoEm.toLocaleDateString("pt-BR")}</p></div><div className="flex items-center gap-1"><Badge variant="outline">{document.tipo.replaceAll("_", " ")}</Badge><a href={document.openHref} target="_blank" rel="noreferrer"><Button className="size-10 p-0" variant="ghost" title="Abrir documento"><ExternalLink className="size-4" /></Button></a><a href={document.openHref} download><Button className="size-10 p-0" variant="ghost" title="Baixar documento"><Download className="size-4" /></Button></a><Button className="size-10 p-0" variant="ghost" title="Excluir documento" disabled={isPending} onClick={() => remove(document.id)}><Trash2 className="size-4" /></Button></div></li>)}</ul>}
  </div>;
}
