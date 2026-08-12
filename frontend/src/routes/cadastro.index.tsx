import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Heart, HeartHandshake, Home, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/cadastro/")({ component: CadastroPage });

const options = [
  {
    to: "/cadastro/adotante" as const,
    icon: Heart,
    title: "Adotante",
    description: "Quero encontrar um animal e oferecer um lar definitivo.",
    detail: "Inclui uma triagem de adoção após a criação da conta.",
  },
  {
    to: "/cadastro/organizacao" as const,
    icon: Building2,
    title: "Organização protetora",
    description: "Represento uma ONG ou associação de proteção animal.",
    detail: "Gerencie animais, solicitações, saúde e documentos.",
  },
  {
    to: "/cadastro/acolhedor" as const,
    icon: Home,
    title: "Acolhedor independente",
    description: "Cuido de animais resgatados como lar temporário.",
    detail: "Divulgue animais e acompanhe todo o processo de adoção.",
  },
];

function CadastroPage() {
  return (
    <main className="page-canvas min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <header className="grid gap-6 rounded-2xl border border-border bg-card/90 p-6 shadow-sm backdrop-blur sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-selection px-3 py-1 text-xs font-semibold text-selection-foreground">
              <HeartHandshake className="h-4 w-4" aria-hidden="true" />
              Faça parte da rede AdoptPlace
            </div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Como você quer participar?
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              Escolha o perfil que melhor representa você. Essa definição adapta sua experiência e
              as ferramentas disponíveis na plataforma.
            </p>
          </div>
          <div className="grid h-20 w-20 place-items-center rounded-2xl border border-primary/20 bg-surface-subtle text-primary md:h-24 md:w-24">
            <HeartHandshake className="h-10 w-10 md:h-12 md:w-12" aria-hidden="true" />
          </div>
        </header>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-surface-subtle px-4 py-3 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <p>
            <strong className="text-foreground">Escolha com tranquilidade.</strong> Cada tipo de
            conta apresenta apenas os recursos e dados necessários para sua atuação.
          </p>
        </div>

        <section aria-labelledby="tipo-conta" className="mt-8">
          <h2 id="tipo-conta" className="font-serif text-2xl font-semibold">
            Selecione um tipo de conta
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {options.map(({ to, icon: Icon, title, description, detail }) => (
              <Link key={to} to={to} className="group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Card className="h-full border-border bg-card transition-colors group-hover:border-primary/60">
                  <CardContent className="flex h-full flex-col p-6">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-surface-subtle text-primary transition-colors group-hover:bg-selection group-hover:text-selection-foreground">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 font-serif text-xl font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                    <p className="mt-4 border-t border-border/70 pt-4 text-xs leading-relaxed text-muted-foreground">
                      {detail}
                    </p>
                    <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold text-primary">
                      Continuar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Já possui uma conta? <Link to="/login" className="font-semibold text-primary hover:underline">Entrar</Link>
        </p>
      </div>
    </main>
  );
}
