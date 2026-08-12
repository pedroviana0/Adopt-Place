import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, MapPin, UsersRound } from "lucide-react";
import { CampoLocalizacao } from "@/components/app/CampoLocalizacao";
import { CadastroField, CadastroSection, CadastroShell, CadastroSubmit } from "@/components/app/CadastroVisual";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { cadastroOrganizacaoSchema, type CadastroOrganizacaoInput } from "@/lib/schemas/cadastro";
import { cadastrarOrganizacao } from "@/lib/data/usuarios";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro/organizacao")({
  head: () => ({ meta: [{ title: "Cadastro de organização — AdoptPlace" }, { name: "description", content: "Cadastre sua organização protetora." }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const f = useForm<CadastroOrganizacaoInput>({ resolver: zodResolver(cadastroOrganizacaoSchema) });
  const onSubmit = async (data: CadastroOrganizacaoInput) => {
    try {
      await cadastrarOrganizacao(data);
      toast.success("Organização cadastrada!");
      navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro no cadastro");
    }
  };

  return (
    <CadastroShell icon={Building2} eyebrow="Proteção animal em rede" title="Cadastro de organização" description="Apresente sua organização e tenha um espaço completo para divulgar animais e acompanhar adoções.">
      <form noValidate onSubmit={f.handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <CadastroSection icon={Building2} title="Dados da organização" description="Identificação institucional e credenciais de acesso.">
          <CadastroField label="Razão social" htmlFor="razaoSocial" error={f.formState.errors.razaoSocial?.message}>
            <Input id="razaoSocial" autoComplete="organization" aria-invalid={Boolean(f.formState.errors.razaoSocial)} {...f.register("razaoSocial")} />
          </CadastroField>
          <div className="grid gap-4 sm:grid-cols-2">
            <CadastroField label="E-mail" htmlFor="email" error={f.formState.errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(f.formState.errors.email)} {...f.register("email")} />
            </CadastroField>
            <CadastroField label="Senha" htmlFor="senha" error={f.formState.errors.senha?.message} hint="Use uma senha segura para proteger a equipe.">
              <PasswordInput id="senha" autoComplete="new-password" aria-invalid={Boolean(f.formState.errors.senha)} {...f.register("senha")} />
            </CadastroField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <CadastroField label="CNPJ (14 dígitos)" htmlFor="cnpj" error={f.formState.errors.cnpj?.message}>
              <Input id="cnpj" inputMode="numeric" aria-invalid={Boolean(f.formState.errors.cnpj)} {...f.register("cnpj")} />
            </CadastroField>
            <CadastroField label="Telefone" htmlFor="telefone" error={f.formState.errors.telefone?.message}>
              <Input id="telefone" type="tel" autoComplete="tel" aria-invalid={Boolean(f.formState.errors.telefone)} {...f.register("telefone")} />
            </CadastroField>
          </div>
        </CadastroSection>

        <CadastroSection icon={UsersRound} title="Responsável e capacidade" description="Quem responde pela organização e quantos animais ela consegue acolher.">
          <div className="grid gap-4 sm:grid-cols-2">
            <CadastroField label="Nome do responsável" htmlFor="responsavelNome" error={f.formState.errors.responsavelNome?.message}>
              <Input id="responsavelNome" autoComplete="name" aria-invalid={Boolean(f.formState.errors.responsavelNome)} {...f.register("responsavelNome")} />
            </CadastroField>
            <CadastroField label="Capacidade máxima" htmlFor="capacidadeMaxima" error={f.formState.errors.capacidadeMaxima?.message} hint="Quantidade máxima de animais sob cuidado simultâneo.">
              <Input id="capacidadeMaxima" type="number" min={1} aria-invalid={Boolean(f.formState.errors.capacidadeMaxima)} {...f.register("capacidadeMaxima", { valueAsNumber: true })} />
            </CadastroField>
          </div>
        </CadastroSection>

        <CadastroSection icon={MapPin} title="Localização" description="Endereço público utilizado para aproximar adotantes da organização.">
          <CampoLocalizacao valor={{ cep: f.watch("cep") ?? "", municipioId: f.watch("municipioId") }} onChange={(value) => { f.setValue("cep", value.cep, { shouldValidate: value.cep.length === 8 }); f.setValue("municipioId", value.municipioId); }} onLogradouro={(logradouro) => { if (!f.getValues("endereco")) f.setValue("endereco", logradouro); }} erro={f.formState.errors.cep?.message} />
          <CadastroField label="Endereço" htmlFor="endereco" error={f.formState.errors.endereco?.message}>
            <Input id="endereco" autoComplete="street-address" placeholder="Rua, número e complemento" aria-invalid={Boolean(f.formState.errors.endereco)} {...f.register("endereco")} />
          </CadastroField>
        </CadastroSection>

        <CadastroSubmit pending={f.formState.isSubmitting} />
      </form>
    </CadastroShell>
  );
}
