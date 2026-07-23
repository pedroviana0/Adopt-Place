import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Building2, Home } from "lucide-react";

export const Route = createFileRoute("/cadastro/")({
  component: CadastroPage,
});

function CadastroPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-serif text-3xl font-semibold">Crie sua conta</h1>
      <p className="mt-1 text-sm text-muted-foreground">Escolha o tipo de conta que se aplica a você.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Opcao to="/cadastro/adotante" icon={<Heart className="h-5 w-5" />} title="Adotante" desc="Quero adotar um animal e dar um novo lar." />
        <Opcao to="/cadastro/organizacao" icon={<Building2 className="h-5 w-5" />} title="Organização protetora" desc="Somos uma ONG ou associação de proteção animal." />
        <Opcao to="/cadastro/acolhedor" icon={<Home className="h-5 w-5" />} title="Acolhedor independente" desc="Cuido de animais resgatados como lar temporário." />
      </div>
    </div>
  );
}

function Opcao({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to}>
      <Card className="h-full transition hover:border-primary hover:shadow-md">
        <CardContent className="p-6">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">{icon}</div>
          <h3 className="mt-4 font-serif text-xl font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
