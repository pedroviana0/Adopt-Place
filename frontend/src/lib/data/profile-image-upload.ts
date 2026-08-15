import { genUploader } from "uploadthing/client";
import type { FileRoute } from "uploadthing/types";
import { uploadThingFetch } from "./animal-photo-upload";

export const MAX_PROFILE_IMAGE_BYTES = 4 * 1024 * 1024;

type FrontendUploadRouter = {
  profileImage: FileRoute<{
    input: Record<string, never>;
    output: { profileImage: { fotoUrl: string } };
    errorShape: { message: string };
  }>;
};

const uploader = genUploader<FrontendUploadRouter>({
  url: "/api/uploadthing",
  package: "uploadthing/client",
  fetch: uploadThingFetch,
});

type ProfileImageUploadFiles = (
  slug: "profileImage",
  options: { files: File[]; input: Record<string, never> },
) => Promise<Array<{ serverData: { profileImage: { fotoUrl: string } } | null }>>;

export function validateProfileImage(file: File): string | null {
  const extension = file.name.toLowerCase().split(".").pop() ?? "";
  if (!file.type.startsWith("image/") || !["jpg", "jpeg", "png", "webp", "gif", "avif", "heic", "heif"].includes(extension)) {
    return "Selecione uma imagem com extensão válida.";
  }
  if (file.size > MAX_PROFILE_IMAGE_BYTES) return "A imagem deve ter no máximo 4 MB.";
  return null;
}

export async function uploadProfileImage(
  file: File,
  uploadFiles: ProfileImageUploadFiles = uploader.uploadFiles,
): Promise<string> {
  const validationError = validateProfileImage(file);
  if (validationError) throw new Error(validationError);

  const uploaded = await uploadFiles("profileImage", { files: [file], input: {} });
  const fotoUrl = uploaded[0]?.serverData?.profileImage?.fotoUrl;
  if (!fotoUrl) throw new Error("O servidor não confirmou a imagem de perfil.");
  return fotoUrl;
}
