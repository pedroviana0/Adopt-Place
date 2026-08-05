import type { ReactNode } from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EmptyState, type EmptyStateProps } from "@/components/app/EmptyState";

type AsyncStateProps = {
  isLoading: boolean;
  isError?: boolean;
  error?: unknown;
  isEmpty?: boolean;
  children: ReactNode;
  loadingFallback?: ReactNode;
  loadingLabel?: string;
  emptyState?: EmptyStateProps;
  errorTitle?: string;
  errorFallback?: string;
  onRetry?: () => void;
  className?: string;
};

function errorDescription(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function AsyncState({
  isLoading,
  isError = false,
  error,
  isEmpty = false,
  children,
  loadingFallback,
  loadingLabel = "Carregando conteúdo…",
  emptyState,
  errorTitle = "Não foi possível carregar",
  errorFallback = "Tente novamente. Se o problema continuar, volte mais tarde.",
  onRetry,
  className = "mt-6",
}: AsyncStateProps) {
  if (isLoading) {
    return loadingFallback ? (
      <div className={className} aria-busy="true" aria-label={loadingLabel}>
        {loadingFallback}
      </div>
    ) : (
      <div
        role="status"
        aria-live="polite"
        className={`${className} flex min-h-24 items-center justify-center gap-2 rounded-xl border border-border bg-surface-subtle px-4 text-sm text-muted-foreground`}
      >
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        {loadingLabel}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className={className} role="alert">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>{errorTitle}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{errorDescription(error, errorFallback)}</p>
          {onRetry && (
            <Button type="button" size="sm" variant="outline" onClick={onRetry}>
              Tentar novamente
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (isEmpty && emptyState) {
    return <EmptyState {...emptyState} className={emptyState.className ?? className} />;
  }

  return <>{children}</>;
}
