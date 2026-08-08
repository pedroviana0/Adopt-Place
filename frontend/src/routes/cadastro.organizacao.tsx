import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { CampoLocalizacao } from "@/components/app/CampoLocalizacao";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cadastroOrganizacaoSchema, type CadastroOrganizacaoInput } from "@/lib/schemas/cadastro";
import { cadastrarOrganizacao } from "@/lib/data/usuarios";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro/organizacao")({
  head: () => ({
    meta: [
      { title: "Cadastro de organização — AdoptPlace" },
      { name: "description", content: "Cadastre sua organização protetora." },
    ],
  }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const f = useForm<CadastroOrganizacaoInput>({ resolver: zodResolver(cadastroOrganizacaoSchema) });
  const onSubmit = async (d: CadastroOrganizacaoInput) => {
    try {
      await cadastrarOrganizacao(d);
      toast.success("Organização cadastrada!");
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
      <h1 className="mt-2 font-serif text-3xl font-semibold">Cadastro de organização</h1>
      <form onSubmit={f.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <Label>Razão social</Label>
          <Input {...f.register("razaoSocial")} />
          {f.formState.errors.razaoSocial && (
            <p className="mt-1 text-xs text-destructive">
              {f.formState.errors.razaoSocial.message}
            </p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>E-mail</Label>
            <Input type="email" {...f.register("email")} />
            {f.formState.errors.email && (
              <p className="mt-1 text-xs text-destructive">{f.formState.errors.email.message}</p>
            )}
          </div>
          <div>
            <Label>Senha</Label>
            <Input type="password" {...f.register("senha")} />
            {f.formState.errors.senha && (
              <p className="mt-1 text-xs text-destructive">{f.formState.errors.senha.message}</p>
            )}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>CNPJ (14 dígitos)</Label>
            <Input {...f.register("cnpj")} />
            {f.formState.errors.cnpj && (
              <p className="mt-1 text-xs text-destructive">{f.formState.errors.cnpj.message}</p>
            )}
          </div>
          <div>
            <Label>Telefone</Label>
            <Input {...f.register("telefone")} />
            {f.formState.errors.telefone && (
              <p className="mt-1 text-xs text-destructive">{f.formState.errors.telefone.message}</p>
            )}
          </div>
        </div>
        <div>
          <Label>Nome do responsável</Label>
          <Input {...f.register("responsavelNome")} />
          {f.formState.errors.responsavelNome && (
            <p className="mt-1 text-xs text-destructive">
              {f.formState.errors.responsavelNome.message}
            </p>
          )}
        </div>
        <div>
          <Label>Endereço</Label>
          <Input {...f.register("endereco")} />
          {f.formState.errors.endereco && (
            <p className="mt-1 text-xs text-destructive">{f.formState.errors.endereco.message}</p>
          )}
        </div>
        <CampoLocalizacao
          valor={{ cep: f.watch("cep") ?? "", municipioId: f.watch("municipioId") }}
          onChange={(v) => {
            f.setValue("cep", v.cep, { shouldValidate: v.cep.length === 8 });
            f.setValue("municipioId", v.municipioId);
          }}
          onLogradouro={(logradouro) => {
            if (!f.getValues("endereco")) f.setValue("endereco", logradouro);
          }}
          erro={f.formState.errors.cep?.message}
        />
        <div>
          <Label>Capacidade máx.</Label>
          <Input type="number" {...f.register("capacidadeMaxima", { valueAsNumber: true })} />
        </div>
        <Button type="submit" size="lg" className="w-full">
          Criar conta
        </Button>
      </form>
    </div>
  );
}
