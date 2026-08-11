export function selectedFiles(files: FileList | null): File[] {
  return files ? Array.from(files) : [];
}
