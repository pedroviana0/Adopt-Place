import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GradientBackground } from "@/components/ui/gradient-background";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/ui/glass-card";
import { login } from "@/lib/data/sessao";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/lib/schemas/cadastro";

const searchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Entrar — AdoptPlace" },
      { name: "description", content: "Acesse sua conta AdoptPlace." },
      { property: "og:title", content: "Entrar — AdoptPlace" },
      {
        property: "og:description",
        content: "Acesse sua conta para adotar, gerenciar animais ou revisar solicitações.",
      },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", senha: "" },
  });

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
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <GradientBackground className="absolute inset-0" />

      <GlassCard className="relative w-full max-w-md border-white/60 bg-white/55 text-foreground shadow-xl shadow-primary/10">
        <GlassCardHeader className="items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <PawPrint className="h-6 w-6" />
          </span>
          <GlassCardTitle
            className="mt-2 font-serif text-3xl font-bold"
            style={{ color: "oklch(0.30 0.06 156)" }}
          >
            Bem-vindo de volta
          </GlassCardTitle>
          <p className="text-sm text-foreground/70">
            Ainda não tem conta?{" "}
            <Link
              to="/cadastro"
              className="font-semibold text-primary underline-offset-2 hover:underline"
            >
              Cadastre-se
            </Link>
          </p>
        </GlassCardHeader>

        <GlassCardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                autoComplete="email"
                className="mt-1 bg-white/70"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div>
              <Label>Senha</Label>
              <Input
                type="password"
                autoComplete="current-password"
                className="mt-1 bg-white/70"
                {...form.register("senha")}
              />
              {form.formState.errors.senha && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.senha.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Entrando…" : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-white/50 bg-white/40 p-4 text-xs text-foreground/70">
            <p className="mb-2 font-semibold text-foreground">
              Contas de teste (senha: <code>AdoptPlace@2026</code>)
            </p>
            <ul className="space-y-0.5">
              <li>admin.teste@example.com — administrador</li>
              <li>organizacao.teste@example.com — organização</li>
              <li>acolhedor.teste@example.com — acolhedor independente</li>
              <li>adotante.aprovado@example.com — adotante com triagem concluída</li>
              <li>adotante.pendente@example.com — adotante com triagem pendente</li>
            </ul>
          </div>
        </GlassCardContent>
      </GlassCard>
    </section>
  );
}
