import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardAction,
  GlassCardContent,
  GlassCardFooter,
} from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
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
        content:
          "Acesse sua conta para adotar, gerenciar animais ou revisar solicitações.",
      },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

// Fundo "vidro" on-brand: base teal escura + brilho teal (topo) e âmbar (base).
const glassBackground =
  "radial-gradient(1200px 600px at 15% 10%, oklch(0.55 0.1 186 / 0.55), transparent 60%)," +
  "radial-gradient(900px 500px at 85% 90%, oklch(0.72 0.15 70 / 0.3), transparent 55%)," +
  "linear-gradient(135deg, oklch(0.3 0.06 192), oklch(0.2 0.04 196))";

const glassField =
  "border-white/25 bg-white/10 text-white placeholder:text-white/60 focus-visible:ring-white/50";

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
    <div
      className="flex min-h-screen w-full flex-col items-center justify-center gap-6 px-4 py-12"
      style={{ backgroundImage: glassBackground }}
    >
      <img
        src="/logo.png"
        alt="AdoptPlace"
        className="h-14 w-auto rounded-xl bg-white p-2 shadow-lg"
      />
      <GlassCard className="w-full max-w-sm">
        <GlassCardHeader>
          <GlassCardTitle className="text-xl">
            Entrar na sua conta
          </GlassCardTitle>
          <GlassCardDescription className="text-white/70">
            Informe seu e-mail e senha para acessar o AdoptPlace.
          </GlassCardDescription>
          <GlassCardAction>
            <Button
              variant="link"
              asChild
              className="text-white underline-offset-4 hover:text-white"
            >
              <Link to="/cadastro">Cadastre-se</Link>
            </Button>
          </GlassCardAction>
        </GlassCardHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <GlassCardContent>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-white">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  maxLength={254}
                  placeholder="m@exemplo.com"
                  autoComplete="email"
                  className={glassField}
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-200">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="senha" className="text-white">
                  Senha
                </Label>
                <PasswordInput
                  id="senha"
                  autoComplete="current-password"
                  className={glassField}
                  // Sobre o vidro escuro, o cinza padrão some.
                  maxLength={128}
                  toggleClassName="text-white/70 hover:text-white focus-visible:ring-white"
                  {...form.register("senha")}
                />
                {form.formState.errors.senha && (
                  <p className="text-xs text-red-200">
                    {form.formState.errors.senha.message}
                  </p>
                )}
              </div>
            </div>
          </GlassCardContent>

          <GlassCardFooter className="mt-6 flex-col gap-2">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Entrando…" : "Entrar"}
            </Button>
          </GlassCardFooter>
        </form>
      </GlassCard>

      <div className="w-full max-w-sm rounded-xl border border-white/20 bg-white/10 p-4 text-xs text-white/80 backdrop-blur-md">
        <p className="mb-2 font-medium text-white">
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
    </div>
  );
}
