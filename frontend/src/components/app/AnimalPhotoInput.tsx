import { Upload, X } from "lucide-react";

import { selectedFiles } from "../../lib/animal-photo-input";
import { cn } from "../../lib/utils";

const INPUT_ID = "animal-photos";
const DESCRIPTION_ID = `${INPUT_ID}-description`;

interface AnimalPhotoInputProps {
  files: File[];
  onChange: (files: File[]) => void;
  minFiles: number;
  disabled?: boolean;
}

function sameFile(a: File, b: File) {
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}

export function AnimalPhotoInput({
  files,
  onChange,
  minFiles,
  disabled = false,
}: AnimalPhotoInputProps) {
  // O input nativo substitui a selecao a cada abertura; acumular deixa a pessoa
  // escolher as fotos em levas, que e como ela costuma achar os arquivos.
  const append = (incoming: File[]) => {
    const novos = incoming.filter(
      (candidate) => !files.some((current) => sameFile(current, candidate)),
    );
    if (novos.length > 0) onChange([...files, ...novos]);
  };

  const remove = (target: File) => {
    onChange(files.filter((file) => !sameFile(file, target)));
  };

  const faltam = minFiles - files.length;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <input
          id={INPUT_ID}
          type="file"
          accept="image/*"
          multiple
          className="peer sr-only"
          aria-describedby={DESCRIPTION_ID}
          disabled={disabled}
          onChange={(event) => {
            append(selectedFiles(event.currentTarget.files));
            // Permite reescolher o mesmo arquivo depois de remove-lo.
            event.currentTarget.value = "";
          }}
        />
        <label
          htmlFor={INPUT_ID}
          className={cn(
            "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground",
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:pointer-events-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          )}
        >
          <Upload aria-hidden="true" />
          {files.length > 0 ? "Adicionar mais fotos" : "Selecionar fotos"}
        </label>
        <span
          id={DESCRIPTION_ID}
          className="min-w-0 text-sm text-muted-foreground"
          aria-live="polite"
        >
          {files.length === 0
            ? `Nenhuma foto selecionada — envie pelo menos ${minFiles}`
            : faltam > 0
              ? `${files.length} foto selecionada — falta ${faltam} para anunciar`
              : `${files.length} fotos selecionadas`}
        </span>
      </div>

      {files.length > 0 && (
        <ul className="flex flex-col gap-1">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
            >
              <span className="shrink-0 text-xs text-muted-foreground">
                {index === 0 ? "Principal" : `Foto ${index + 1}`}
              </span>
              <span className="min-w-0 flex-1 truncate" title={file.name}>
                {file.name}
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => remove(file)}
                aria-label={`Remover ${file.name}`}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
