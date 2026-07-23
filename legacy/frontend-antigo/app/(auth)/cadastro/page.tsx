import Link from "next/link";
import { HeartHandshake, Home, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui";

const profiles = [
  {
    href: "/cadastro/adotante",
    title: "Adotante",
    description: "Criar conta para preencher triagem, solicitar adocao e acompanhar favoritos.",
    icon: HeartHandshake,
  },
  {
    href: "/cadastro/organizacao",
    title: "Organizacao",
    description: "Fluxo reservado para a etapa de cadastro de organizacoes.",
    icon: ShieldCheck,
  },
  {
    href: "/cadastro/acolhedor",
    title: "Acolhedor",
    description: "Fluxo reservado para a etapa de cadastro de acolhedores independentes.",
    icon: Home,
  },
];

export default function CadastroPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Criar conta</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Escolha o perfil para continuar.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {profiles.map((profile) => {
          const Icon = profile.icon;

          return (
            <Link key={profile.href} href={profile.href}>
              <Card className="h-full transition hover:border-[var(--primary)]">
                <CardHeader>
                  <Icon aria-hidden="true" className="text-[var(--primary)]" size={24} />
                  <h2 className="text-xl font-semibold">{profile.title}</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[var(--muted-foreground)]">{profile.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
