import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Home, MapPin, UserRound } from "lucide-react";
import { CampoLocalizacao } from "@/components/app/CampoLocalizacao";
import { CadastroField, CadastroSection, CadastroShell, CadastroSubmit } from "@/components/app/CadastroVisual";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { cadastroAcolhedorSchema, type CadastroAcolhedorInput } from "@/lib/schemas/cadastro";
import { cadastrarAcolhedor } from "@/lib/data/usuarios";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro/acolhedor")({
  head: () => ({ meta: [{ title: "Cadastro de acolhedor — AdoptPlace" }, { name: "description", content: "Cadastre-se como acolhedor independente." }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const f = useForm<CadastroAcolhedorInput>({ resolver: zodResolver(cadastroAcolhedorSchema) });
  const onSubmit = async (data: CadastroAcolhedorInput) => {
    try {
      await cadastrarAcolhedor(data);
      toast.success("Acolhedor cadastrado!");
      navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro no cadastro");
    }
  };

  return (
    <CadastroShell icon={Home} eyebrow="Um lar temporário transforma vidas" title="Cadastro de acolhedor" description="Crie seu perfil para divulgar animais resgatados e encontrar famílias responsáveis para eles.">
      <form noValidate onSubmit={f.handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <CadastroSection icon={UserRound} title="Dados pessoais" description="Informações de identificação, contato e acesso.">
          <CadastroField label="Nome completo" htmlFor="nomeCompleto" error={f.formState.errors.nomeCompleto?.message}>
            <Input id="nomeCompleto" autoComplete="name" aria-invalid={Boolean(f.formState.errors.nomeCompleto)} {...f.register("nomeCompleto")} />
          </CadastroField>
          <div className="grid gap-4 sm:grid-cols-2">
            <CadastroField label="E-mail" htmlFor="email" error={f.formState.errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(f.formState.errors.email)} {...f.register("email")} />
            </CadastroField>
            <CadastroField label="Senha" htmlFor="senha" error={f.formState.errors.senha?.message} hint="Use uma senha segura e fácil de lembrar.">
              <PasswordInput id="senha" autoComplete="new-password" aria-invalid={Boolean(f.formState.errors.senha)} {...f.register("senha")} />
            </CadastroField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <CadastroField label="CPF (11 dígitos)" htmlFor="cpf" error={f.formState.errors.cpf?.message}>
              <Input id="cpf" inputMode="numeric" aria-invalid={Boolean(f.formState.errors.cpf)} {...f.register("cpf")} />
            </CadastroField>
            <CadastroField label="Telefone" htmlFor="telefone" error={f.formState.errors.telefone?.message}>
              <Input id="telefone" type="tel" autoComplete="tel" aria-invalid={Boolean(f.formState.errors.telefone)} {...f.register("telefone")} />
            </CadastroField>
          </div>
        </CadastroSection>

        <CadastroSection icon={MapPin} title="Localização do acolhimento" description="Apenas o município aparece publicamente; seu endereço completo permanece privado.">
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
