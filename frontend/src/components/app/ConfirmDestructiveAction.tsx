import { useRef, useState, type ReactNode } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ConfirmDestructiveActionProps = {
  trigger: ReactNode;
  title: string;
  item: string;
  consequence: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void>;
  confirmVariant?: "default" | "destructive";
  disabled?: boolean;
};

export function ConfirmDestructiveAction({
  trigger,
  title,
  item,
  consequence,
  confirmLabel,
  cancelLabel = "Cancelar",
  onConfirm,
  confirmVariant = "destructive",
  disabled = false,
}: ConfirmDestructiveActionProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);

  const confirm = async () => {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      setOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível concluir a ação.");
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (pending) return;
        setOpen(nextOpen);
        if (!nextOpen) setError(null);
      }}
    >
      <AlertDialogTrigger asChild disabled={disabled}>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelButton.current?.focus();
        }}
      >
        <AlertDialogHeader>
          <div className="mb-1 flex items-center justify-center gap-2 text-destructive sm:justify-start">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-semibold">Confirmação necessária</span>
          </div>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block break-words font-medium text-foreground">{item}</span>
            <span className="block">{consequence}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel ref={cancelButton} disabled={pending}>
            {cancelLabel}
          </AlertDialogCancel>
          <Button type="button" variant={confirmVariant} disabled={pending} onClick={confirm}>
            {pending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {pending ? "Processando…" : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
