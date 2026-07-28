import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cadastroAcolhedorSchema, type CadastroAcolhedorInput } from "@/lib/schemas/cadastro";
import { cadastrarAcolhedor } from "@/lib/data/usuarios";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro/acolhedor")({
  head: () => ({
    meta: [
      { title: "Cadastro de acolhedor — AdoptPlace" },
      { name: "description", content: "Cadastre-se como acolhedor independente." },
    ],
  }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const f = useForm<CadastroAcolhedorInput>({ resolver: zodResolver(cadastroAcolhedorSchema) });
  const onSubmit = async (d: CadastroAcolhedorInput) => {
    try {
      await cadastrarAcolhedor(d);
      toast.success("Acolhedor cadastrado!");
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link to="/cadastro" className="text-xs text-muted-foreground hover:underline">
        ← Outros tipos de conta
      </Link>
      <h1 className="mt-2 font-serif text-3xl font-semibold">Cadastro de acolhedor</h1>
      <form onSubmit={f.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <Label>Nome completo</Label>
          <Input {...f.register("nomeCompleto")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>E-mail</Label>
            <Input type="email" {...f.register("email")} />
          </div>
          <div>
            <Label>Senha</Label>
            <Input type="password" {...f.register("senha")} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>CPF (11 dígitos)</Label>
            <Input {...f.register("cpf")} />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input {...f.register("telefone")} />
          </div>
        </div>
        <div>
          <Label>Endereço</Label>
          <Input {...f.register("endereco")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Cidade</Label>
            <Input {...f.register("cidade")} />
          </div>
          <div>
            <Label>UF</Label>
            <Input maxLength={2} {...f.register("estado")} />
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full">
          Criar conta
        </Button>
      </form>
    </div>
  );
}
