import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Heart, MapPin, UserRound } from "lucide-react";
import { CampoLocalizacao } from "@/components/app/CampoLocalizacao";
import {
  CadastroField,
  CadastroSection,
  CadastroShell,
  CadastroSubmit,
} from "@/components/app/CadastroVisual";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { cadastroAdotanteSchema, type CadastroAdotanteInput } from "@/lib/schemas/cadastro";
import { cadastrarAdotante } from "@/lib/data/usuarios";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro/adotante")({
  head: () => ({ meta: [{ title: "Cadastro de adotante — AdoptPlace" }, { name: "description", content: "Crie sua conta de adotante." }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const f = useForm<CadastroAdotanteInput>({ resolver: zodResolver(cadastroAdotanteSchema) });
  const onSubmit = async (data: CadastroAdotanteInput) => {
    try {
      await cadastrarAdotante(data);
      toast.success("Cadastro concluído! Vamos para a triagem.");
      navigate({ to: "/triagem" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro no cadastro");
    }
  };

  return (
    <CadastroShell
      icon={Heart}
      eyebrow="Primeiro passo para adotar"
      title="Cadastro de adotante"
      description="Crie sua conta para favoritar animais, conversar com responsáveis e iniciar uma adoção consciente."
    >
      <form noValidate onSubmit={f.handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <CadastroSection icon={UserRound} title="Dados pessoais" description="Informações de identificação e acesso à sua conta.">
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
              <Input id="cpf" inputMode="numeric" autoComplete="off" aria-invalid={Boolean(f.formState.errors.cpf)} {...f.register("cpf")} />
            </CadastroField>
            <CadastroField label="Telefone" htmlFor="telefone" error={f.formState.errors.telefone?.message}>
              <Input id="telefone" type="tel" autoComplete="tel" aria-invalid={Boolean(f.formState.errors.telefone)} {...f.register("telefone")} />
            </CadastroField>
          </div>
          <CadastroField label="Instagram (opcional)" htmlFor="instagram" hint="Ajuda os responsáveis a conhecerem melhor você.">
            <Input id="instagram" placeholder="@seuusuario" {...f.register("instagram")} />
          </CadastroField>
        </CadastroSection>

        <CadastroSection icon={MapPin} title="Onde você mora" description="Seu endereço é privado e ajuda a organizar o processo de adoção.">
          <CampoLocalizacao
            valor={{ cep: f.watch("cep") ?? "", municipioId: f.watch("municipioId") }}
            onChange={(value) => {
              f.setValue("cep", value.cep, { shouldValidate: value.cep.length === 8 });
              f.setValue("municipioId", value.municipioId);
            }}
            onLogradouro={(logradouro) => { if (!f.getValues("endereco")) f.setValue("endereco", logradouro); }}
            erro={f.formState.errors.cep?.message}
          />
          <CadastroField label="Endereço" htmlFor="endereco" error={f.formState.errors.endereco?.message}>
            <Input id="endereco" autoComplete="street-address" placeholder="Rua, número e complemento" aria-invalid={Boolean(f.formState.errors.endereco)} {...f.register("endereco")} />
          </CadastroField>
        </CadastroSection>

        <CadastroSubmit pending={f.formState.isSubmitting} />
      </form>
    </CadastroShell>
  );
}
