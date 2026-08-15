import { cloneElement, isValidElement, type ReactElement } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function CadastroShell({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="page-canvas min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <Link
          to="/cadastro"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Escolher outro tipo de conta
        </Link>

        <header className="grid gap-6 rounded-2xl border border-border bg-card/90 p-6 shadow-sm backdrop-blur sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-selection px-3 py-1 text-xs font-semibold text-selection-foreground">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {eyebrow}
            </div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{description}</p>
          </div>
          <div className="grid h-20 w-20 place-items-center rounded-2xl border border-primary/20 bg-surface-subtle text-primary md:h-24 md:w-24">
            <Icon className="h-10 w-10 md:h-12 md:w-12" aria-hidden="true" />
          </div>
        </header>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-surface-subtle px-4 py-3 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <p>
            <strong className="text-foreground">Seus dados são protegidos.</strong> Usamos essas
            informações somente para segurança, contato e funcionamento da plataforma.
          </p>
        </div>

        {children}
      </div>
    </main>
  );
}

export function CadastroSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3 border-b border-border/70 pb-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-subtle text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-serif text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function CadastroField({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  const describedChild = isValidElement(children) && errorId
    ? cloneElement(children as ReactElement<{ "aria-describedby"?: string }>, {
        "aria-describedby": error ? errorId : undefined,
      })
    : children;
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {describedChild}
      {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function CadastroSubmit({ pending }: { pending: boolean }) {
  return (
    <div className="sticky bottom-4 z-10 rounded-2xl border border-border bg-card/95 p-4 shadow-floating backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground sm:mb-0">
        <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
        Revise os dados antes de criar sua conta.
      </div>
      <Button type="submit" size="lg" className="w-full sm:w-auto sm:min-w-48" disabled={pending}>
        {pending ? "Criando conta…" : "Criar conta"}
      </Button>
    </div>
  );
}
