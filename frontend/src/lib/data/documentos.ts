import { genUploader } from "uploadthing/client";
import type { FileRoute } from "uploadthing/types";

import type { TipoDocumentoSaude } from "../domain/enums";
import { apiRequest } from "./api";
import { uploadThingFetch } from "./animal-photo-upload";

// ============================================================================
// Issue #57 (T100): health documents over /api/saude/documentos and the
// uploadthing `healthDocument` route. Ownership and privacy are enforced by the
// backend; documents are internal and never exposed publicly.
// ============================================================================

export const MAX_HEALTH_DOCUMENT_BYTES = 10 * 1024 * 1024;

export interface HealthDocument {
  id: string;
  animalId: string;
  animal: { id: string; nome: string; href: string };
  registroSaudeId: string | null;
  registroSaude: {
    id: string;
    tipo: string;
    titulo: string | null;
    dataRegistro: string;
  } | null;
  tipo: TipoDocumentoSaude;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  criadoEm: string;
  openHref: string;
}

export interface DocumentFilters {
  animalId?: string;
  tipo?: TipoDocumentoSaude;
}

export async function fetchDocumentos(filters: DocumentFilters = {}): Promise<HealthDocument[]> {
  const qs = new URLSearchParams();
  if (filters.animalId) qs.set("animalId", filters.animalId);
  if (filters.tipo) qs.set("tipo", filters.tipo);
  const query = qs.toString();
  const data = await apiRequest<{ documents: HealthDocument[] }>(
    `/api/saude/documentos${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
  return data.documents;
}

export async function excluirDocumento(id: string): Promise<void> {
  await apiRequest(`/api/saude/documentos/${id}`, { method: "DELETE" });
}

export function validateDocumentFile(file: File): void {
  const isPdf = file.type === "application/pdf";
  const isImage = file.type.startsWith("image/");
  const extension = file.name.toLowerCase().split(".").pop() ?? "";
  const imageExtension = ["jpg", "jpeg", "png", "webp", "gif", "avif", "heic", "heif"].includes(extension);
  if ((!isPdf && !isImage) || (isPdf && extension !== "pdf") || (isImage && !imageExtension)) {
    throw new Error("Envie uma imagem ou arquivo PDF.");
  }
  if (file.size > MAX_HEALTH_DOCUMENT_BYTES) {
    throw new Error("O arquivo deve ter no máximo 10 MB.");
  }
}

type FrontendDocumentRouter = {
  healthDocument: FileRoute<{
    input: {
      animalId: string;
      registroSaudeId?: string;
      tipoDocumento: TipoDocumentoSaude;
    };
    output: { documentId: string; uploadedBy: string; animalId: string };
    errorShape: { message: string };
  }>;
};

const uploader = genUploader<FrontendDocumentRouter>({
  url: "/api/uploadthing",
  package: "uploadthing/client",
  fetch: uploadThingFetch,
});

export interface NovoDocumento {
  animalId: string;
  tipoDocumento: TipoDocumentoSaude;
  registroSaudeId?: string;
  file: File;
}

export async function uploadDocumento(
  input: NovoDocumento,
  onProgress?: (progress: number) => void,
): Promise<{ documentId: string; animalId: string }> {
  validateDocumentFile(input.file);
  try {
    const uploaded = await uploader.uploadFiles("healthDocument", {
      files: [input.file],
      input: {
        animalId: input.animalId,
        tipoDocumento: input.tipoDocumento,
        ...(input.registroSaudeId ? { registroSaudeId: input.registroSaudeId } : {}),
      },
      onUploadProgress: ({ totalProgress }: { totalProgress: number }) =>
        onProgress?.(totalProgress),
    });
    const server = uploaded[0]?.serverData;
    if (!server?.documentId) {
      throw new Error("A persistência do documento não foi confirmada.");
    }
    return { documentId: server.documentId, animalId: server.animalId };
  } catch (error) {
    if (error instanceof Error && error.message.includes("não foi confirmada")) {
      throw error;
    }
    throw new Error("Não foi possível enviar o documento. Tente novamente.", {
      cause: error,
    });
  }
}
