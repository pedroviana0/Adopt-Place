// Utilitário de upload/compressão de imagem para o fluxo mock (localStorage).
// Quando o backend real entrar, este arquivo pode ser substituído por um
// wrapper de Uploadthing/S3 preservando a assinatura de `compressImageToDataUrl`.

export async function compressImageToDataUrl(
  file: File,
  maxSize = 1000,
  quality = 0.7
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Arquivo não é uma imagem");
  }
  const bitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível ler a imagem"));
    img.src = URL.createObjectURL(file);
  });

  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.drawImage(bitmap, 0, 0, w, h);
  URL.revokeObjectURL(bitmap.src);
  return canvas.toDataURL("image/jpeg", quality);
}

export function isQuotaExceeded(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const name = err.name || "";
  return (
    name === "QuotaExceededError" ||
    name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    /quota/i.test(err.message)
  );
}

export const QUOTA_MESSAGE =
  "Não foi possível salvar esta foto — tente uma imagem menor ou remova fotos antigas";
