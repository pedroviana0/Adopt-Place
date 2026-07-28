import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/data/sessao";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/lib/schemas/cadastro";

const searchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  head: () => ({ meta: [
    { title: "Entrar — AdoptPlace" },
    { name: "description", content: "Acesse sua conta AdoptPlace." },
    { property: "og:title", content: "Entrar — AdoptPlace" },
    { property: "og:description", content: "Acesse sua conta para adotar, gerenciar animais ou revisar solicitações." },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", senha: "" } });

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data.email, data.senha);
      toast.success("Bem-vindo(a)!");
      navigate({ to: (search.next as string) ?? "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro no login");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-serif text-3xl font-semibold">Entrar</h1>
      <p className="mt-1 text-sm text-muted-foreground">Ainda não tem conta? <Link to="/cadastro" className="text-primary underline">Cadastre-se</Link>.</p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <Label>E-mail</Label>
          <Input type="email" {...form.register("email")} />
          {form.formState.errors.email && <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>}
        </div>
        <div>
          <Label>Senha</Label>
          <Input type="password" {...form.register("senha")} />
          {form.formState.errors.senha && <p className="mt-1 text-xs text-destructive">{form.formState.errors.senha.message}</p>}
        </div>
        <Button type="submit" className="w-full" size="lg">Entrar</Button>
      </form>

      <div className="mt-8 rounded-xl border bg-card p-4 text-xs text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">Contas de teste (senha: <code>senha123</code>)</p>
        <ul className="space-y-0.5">
          <li>ana@adotante.com — adotante com triagem concluída</li>
          <li>joao@adotante.com — adotante sem triagem</li>
          <li>contato@spavr.org — organização SPA-VR</li>
          <li>contato@ciaanimalvr.org — organização Cia Animal VR</li>
          <li>maria@acolhedor.com — acolhedor independente</li>
          <li>admin@adoptplace.com — administrador</li>
        </ul>
      </div>
    </div>
  );
}
