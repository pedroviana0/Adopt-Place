import { Upload } from "lucide-react";

import { firstSelectedFile } from "../../lib/animal-photo-input";
import { cn } from "../../lib/utils";

const INPUT_ID = "animal-primary-photo";
const DESCRIPTION_ID = `${INPUT_ID}-description`;

interface AnimalPhotoInputProps {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

export function AnimalPhotoInput({ file, onChange, disabled = false }: AnimalPhotoInputProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      <input
        id={INPUT_ID}
        type="file"
        accept="image/*"
        className="peer sr-only"
        aria-describedby={DESCRIPTION_ID}
        disabled={disabled}
        onChange={(event) => onChange(firstSelectedFile(event.currentTarget.files))}
      />
      <label
        htmlFor={INPUT_ID}
        className={cn(
          "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground",
          "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:pointer-events-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        )}
      >
        <Upload aria-hidden="true" />
        Selecionar foto
      </label>
      <span
        id={DESCRIPTION_ID}
        className="min-w-0 truncate text-sm text-muted-foreground"
        aria-live="polite"
        title={file?.name}
      >
        {file?.name ?? "Nenhum arquivo selecionado"}
      </span>
    </div>
  );
}
