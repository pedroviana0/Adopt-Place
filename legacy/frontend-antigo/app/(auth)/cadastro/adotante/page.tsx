"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerAdopter } from "@/lib/actions/auth-register";
import { initialFormState } from "@/lib/actions/form-state";
import { Alert, Button, Card, CardContent, CardHeader, Form, FormItem, FormLabel, Input } from "@/components/ui";

function fieldError(errors: Record<string, string[]> | undefined, name: string) {
  return errors?.[name]?.[0] ? (
    <p className="text-sm text-[var(--destructive)]">{errors[name][0]}</p>
  ) : null;
}

export default function CadastroAdotantePage() {
  const [state, action, pending] = useActionState(registerAdopter, initialFormState);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold">Cadastro de adotante</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Depois do cadastro, voce sera direcionado para a triagem.
          </p>
        </CardHeader>
        <CardContent>
          <Form action={action}>
            {state.message ? <Alert variant="destructive">{state.message}</Alert> : null}
            <div className="grid gap-4 md:grid-cols-2">
              <FormItem>
                <FormLabel htmlFor="nomeCompleto">Nome completo</FormLabel>
                <Input id="nomeCompleto" name="nomeCompleto" autoComplete="name" />
                {fieldError(state.fieldErrors, "nomeCompleto")}
              </FormItem>
              <FormItem>
                <FormLabel htmlFor="cpf">CPF</FormLabel>
                <Input id="cpf" name="cpf" />
                {fieldError(state.fieldErrors, "cpf")}
              </FormItem>
              <FormItem>
                <FormLabel htmlFor="email">E-mail</FormLabel>
                <Input id="email" name="email" type="email" autoComplete="email" />
                {fieldError(state.fieldErrors, "email")}
              </FormItem>
              <FormItem>
                <FormLabel htmlFor="telefone">Telefone</FormLabel>
                <Input id="telefone" name="telefone" autoComplete="tel" />
                {fieldError(state.fieldErrors, "telefone")}
              </FormItem>
              <FormItem>
                <FormLabel htmlFor="instagram">Instagram</FormLabel>
                <Input id="instagram" name="instagram" />
                {fieldError(state.fieldErrors, "instagram")}
              </FormItem>
              <FormItem>
                <FormLabel htmlFor="estado">Estado</FormLabel>
                <Input id="estado" name="estado" maxLength={2} defaultValue="RJ" />
                {fieldError(state.fieldErrors, "estado")}
              </FormItem>
              <FormItem className="md:col-span-2">
                <FormLabel htmlFor="endereco">Endereco</FormLabel>
                <Input id="endereco" name="endereco" autoComplete="street-address" />
                {fieldError(state.fieldErrors, "endereco")}
              </FormItem>
              <FormItem>
                <FormLabel htmlFor="cidade">Cidade</FormLabel>
                <Input id="cidade" name="cidade" autoComplete="address-level2" />
                {fieldError(state.fieldErrors, "cidade")}
              </FormItem>
              <FormItem>
                <FormLabel htmlFor="password">Senha</FormLabel>
                <Input id="password" name="password" type="password" autoComplete="new-password" />
                {fieldError(state.fieldErrors, "password")}
              </FormItem>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button type="submit" disabled={pending}>
                {pending ? "Criando..." : "Criar conta"}
              </Button>
              <Link href="/login" className="text-sm font-medium text-[var(--primary)]">
                Ja tenho conta
              </Link>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
