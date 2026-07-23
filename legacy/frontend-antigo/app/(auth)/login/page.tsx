"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";

import { loginWithCredentials } from "@/lib/actions/login";
import { initialFormState } from "@/lib/actions/form-state";
import { Alert, Button, Card, CardContent, CardHeader, Form, FormItem, FormLabel, Input } from "@/components/ui";

function fieldError(errors: Record<string, string[]> | undefined, name: string) {
  return errors?.[name]?.[0] ? (
    <p className="text-sm text-[var(--destructive)]">{errors[name][0]}</p>
  ) : null;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [state, action, pending] = useActionState(loginWithCredentials, initialFormState);

  return (
    <Card className="w-full">
      <CardHeader>
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Acesse sua conta AdoptPlace.</p>
      </CardHeader>
      <CardContent>
        <Form action={action}>
          {state.message ? <Alert variant="destructive">{state.message}</Alert> : null}
          <input type="hidden" name="callbackUrl" value={searchParams.get("callbackUrl") ?? "/dashboard"} />
          <FormItem>
            <FormLabel htmlFor="email">E-mail</FormLabel>
            <Input id="email" name="email" type="email" autoComplete="email" />
            {fieldError(state.fieldErrors, "email")}
          </FormItem>
          <FormItem>
            <FormLabel htmlFor="password">Senha</FormLabel>
            <Input id="password" name="password" type="password" autoComplete="current-password" />
            {fieldError(state.fieldErrors, "password")}
          </FormItem>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Entrando..." : "Entrar"}
          </Button>
          <p className="text-center text-sm text-[var(--muted-foreground)]">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="font-medium text-[var(--primary)]">
              Cadastre-se
            </Link>
          </p>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
