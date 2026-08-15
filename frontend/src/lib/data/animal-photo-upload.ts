import { genUploader } from "uploadthing/client";
import type { FileRoute } from "uploadthing/types";

export const MAX_ANIMAL_PHOTO_BYTES = 4 * 1024 * 1024;

// Espelha MIN_PHOTOS_TO_PUBLISH do backend, que é quem realmente decide.
// Aqui serve só para avisar antes de a pessoa perder o envio.
export const MIN_ANIMAL_PHOTOS = 2;

export function animalPhotoKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export type UploadedAnimalPhoto = {
  id: string;
  animalId: string;
  principal: boolean;
  ordem: number;
};

type FrontendUploadRouter = {
  animalPhoto: FileRoute<{
    input: { animalId: string };
    output: { photo: UploadedAnimalPhoto };
    errorShape: { message: string };
  }>;
};

function isLocalUploadRoute(input: RequestInfo | URL): boolean {
  const rawUrl =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  const browserOrigin =
    typeof window === "undefined" ? undefined : window.location.origin;
  const url = new URL(rawUrl, browserOrigin ?? "http://localhost");

  return (
    url.pathname === "/api/uploadthing" &&
    (rawUrl.startsWith("/") || url.origin === browserOrigin)
  );
}

export function uploadThingFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, {
    ...init,
    // UploadThing returns a cross-origin storage URL after this authenticated call.
    credentials: isLocalUploadRoute(input) ? "include" : "omit",
  });
}

const uploader = genUploader<FrontendUploadRouter>({
  url: "/api/uploadthing",
  package: "uploadthing/client",
  fetch: uploadThingFetch,
});

type AnimalPhotoUploadFiles = (
  slug: "animalPhoto",
  options: {
    files: File[];
    input: { animalId: string };
    onUploadProgress: (event: { totalProgress: number }) => void;
  },
) => Promise<Array<{ serverData: { photo: UploadedAnimalPhoto } | null }>>;

export function validateAnimalPhotoFile(file: File): void {
  const extension = file.name.toLowerCase().split(".").pop() ?? "";
  if (!file.type.startsWith("image/") || !["jpg", "jpeg", "png", "webp", "gif", "avif", "heic", "heif"].includes(extension)) {
    throw new Error("Apenas imagens são permitidas.");
  }
  if (file.size > MAX_ANIMAL_PHOTO_BYTES) {
    throw new Error("A imagem deve ter no máximo 4 MB.");
  }
}

export function validateAnimalPhoto(file: File): string | null {
  try {
    validateAnimalPhotoFile(file);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Arquivo invalido.";
  }
}

export function animalPhotoUploadErrorMessage(_error: unknown): string {
  return "Não foi possível enviar a foto. Tente novamente.";
}

export async function uploadAnimalPhoto(
  animalId: string,
  file: File,
  onProgress?: (progress: number) => void,
  uploadFiles: AnimalPhotoUploadFiles = uploader.uploadFiles,
): Promise<UploadedAnimalPhoto> {
  validateAnimalPhotoFile(file);

  try {
    const uploaded = await uploadFiles("animalPhoto", {
      files: [file],
      input: { animalId },
      onUploadProgress: ({ totalProgress }) => onProgress?.(totalProgress),
    });
    const photo = uploaded[0]?.serverData?.photo;
    if (!photo?.id || photo.animalId !== animalId) {
      throw new Error("A persistência da foto não foi confirmada.");
    }
    return photo;
  } catch (error) {
    if (error instanceof Error && error.message.includes("não foi confirmada")) {
      throw error;
    }
    throw new Error(animalPhotoUploadErrorMessage(error), { cause: error });
  }
}
