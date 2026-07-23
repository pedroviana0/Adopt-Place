import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cadastroAdotanteSchema, type CadastroAdotanteInput } from "@/lib/schemas/cadastro";
import { cadastrarAdotante } from "@/lib/data/usuarios";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro/adotante")({
  head: () => ({ meta: [{ title: "Cadastro de adotante — AdoptPlace" }, { name: "description", content: "Crie sua conta de adotante." }] }),
  component: Page,
});

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Page() {
  const navigate = useNavigate();
  const f = useForm<CadastroAdotanteInput>({ resolver: zodResolver(cadastroAdotanteSchema) });
  const onSubmit = (d: CadastroAdotanteInput) => {
    try {
      cadastrarAdotante(d);
      toast.success("Cadastro concluído! Vamos para a triagem.");
      navigate({ to: "/triagem" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro no cadastro");
    }
  };
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link to="/cadastro" className="text-xs text-muted-foreground hover:underline">← Outros tipos de conta</Link>
      <h1 className="mt-2 font-serif text-3xl font-semibold">Cadastro de adotante</h1>
      <p className="mt-1 text-sm text-muted-foreground">Após o cadastro você será direcionado para a triagem obrigatória.</p>
      <form onSubmit={f.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Field label="Nome completo" error={f.formState.errors.nomeCompleto?.message}><Input {...f.register("nomeCompleto")} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="E-mail" error={f.formState.errors.email?.message}><Input type="email" {...f.register("email")} /></Field>
          <Field label="Senha" error={f.formState.errors.senha?.message}><Input type="password" {...f.register("senha")} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CPF (11 dígitos)" error={f.formState.errors.cpf?.message}><Input {...f.register("cpf")} /></Field>
          <Field label="Telefone" error={f.formState.errors.telefone?.message}><Input {...f.register("telefone")} /></Field>
        </div>
        <Field label="Endereço" error={f.formState.errors.endereco?.message}><Input {...f.register("endereco")} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Cidade" error={f.formState.errors.cidade?.message}><Input {...f.register("cidade")} /></Field>
          <Field label="UF" error={f.formState.errors.estado?.message}><Input maxLength={2} {...f.register("estado")} /></Field>
          <Field label="Instagram (opcional)"><Input {...f.register("instagram")} /></Field>
        </div>
        <Button type="submit" size="lg" className="w-full">Criar conta</Button>
      </form>
    </div>
  );
}
