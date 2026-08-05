export function firstSelectedFile(files: FileList | null): File | null {
  return files?.[0] ?? null;
}
