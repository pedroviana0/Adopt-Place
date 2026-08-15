import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useSessao } from "@/lib/data/hooks";
import { fetchPerfil, atualizarPerfil, type ApiError, type PerfilDTO } from "@/lib/data/usuarios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadProfileImage, validateProfileImage } from "@/lib/data/profile-image-upload";
import { addressSchema, emailSchema, personNameSchema, phoneSchema } from "@/lib/schemas/common";

export const Route = createFileRoute("/_authenticated/dashboard/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — AdoptPlace" },
      { name: "description", content: "Atualize seus dados de conta." },
    ],
  }),
  component: Page,
});

// Fields mirror the backend PATCH /api/perfil allowlist (.strict()). Images use
// the separate Uploadthing contract and are never accepted by this form PATCH.
const descriptionField = z.string().trim().max(500, "Use no máximo 500 caracteres");

const orgSchema = z.object({
  razaoSocial: z.string().trim().min(3, "Informe a razão social.").max(160, "Use no máximo 160 caracteres."),
  responsavelNome: personNameSchema,
  email: emailSchema,
  telefone: phoneSchema,
  endereco: addressSchema,
  cidade: z.string().trim().min(2, "Informe a cidade").max(80),
  estado: z.string().trim().length(2, "UF com 2 letras"),
  capacidadeMaxima: z.number().finite().int("Informe um número inteiro.").min(0).max(10000, "Informe no máximo 10.000.").nullable().optional(),
  descricao: descriptionField,
});
type OrgForm = z.infer<typeof orgSchema>;

const acoSchema = z.object({
  nomeCompleto: personNameSchema,
  email: emailSchema,
  telefone: phoneSchema,
  endereco: addressSchema,
  cidade: z.string().trim().min(2, "Informe a cidade").max(80),
  estado: z.string().trim().length(2, "UF com 2 letras"),
  capacidadeAtual: z.coerce.number().finite().int("Informe um número inteiro.").min(0).max(10000, "Informe no máximo 10.000."),
  descricao: descriptionField,
});
type AcoForm = z.infer<typeof acoSchema>;

function Page() {
  const s = useSessao();
  const navigate = useNavigate();
  const perfil = useQuery({ queryKey: ["perfil"], queryFn: fetchPerfil });

  useEffect(() => {
    if (s && s.tipoPerfil !== "ORGANIZACAO" && s.tipoPerfil !== "ACOLHEDOR") {
      navigate({ to: "/dashboard" });
    }
  }, [s, navigate]);

  if (!s) return null;
  if (perfil.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }
  if (perfil.isError || !perfil.data) {
    return <p className="text-muted-foreground">Não foi possível carregar o perfil.</p>;
  }
  if (perfil.data.tipoPerfil === "ORGANIZACAO") return <OrgProfile perfil={perfil.data} />;
  if (perfil.data.tipoPerfil === "ACOLHEDOR") return <AcoProfile perfil={perfil.data} />;
  return null;
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function ProfileImageEditor({ perfil }: { perfil: PerfilDTO }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const label = perfil.razaoSocial ?? perfil.nomeCompleto ?? "Perfil";

  async function onFile(file?: File) {
    if (!file) return;
    const validationError = validateProfileImage(file);
    if (validationError) return toast.error(validationError);
    setUploading(true);
    try {
      await uploadProfileImage(file);
      await queryClient.invalidateQueries({ queryKey: ["perfil"] });
      toast.success("Imagem de perfil atualizada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar imagem");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="mt-6 flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
      <Avatar className="h-20 w-20 border">
        {perfil.fotoUrl ? <AvatarImage src={perfil.fotoUrl} alt={`Imagem de ${label}`} /> : null}
        <AvatarFallback className="text-xl font-semibold">
          {label.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="space-y-2">
        <h2 className="font-medium">Imagem pública do perfil</h2>
        <p className="text-sm text-muted-foreground">JPG, PNG ou WebP, com no máximo 4 MB.</p>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/*"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Enviando..." : perfil.fotoUrl ? "Trocar imagem" : "Adicionar imagem"}
        </Button>
      </div>
    </section>
  );
}

function OrgProfile({ perfil }: { perfil: PerfilDTO }) {
  const queryClient = useQueryClient();
  const form = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      razaoSocial: perfil.razaoSocial ?? "",
      responsavelNome: perfil.responsavelNome ?? "",
      email: perfil.email,
      telefone: perfil.telefone ?? "",
      endereco: perfil.endereco ?? "",
      cidade: perfil.cidade ?? "",
      estado: perfil.estado ?? "",
      capacidadeMaxima: perfil.capacidadeMaxima ?? null,
      descricao: perfil.descricao ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const { cidade: _cidade, estado: _estado, ...patch } = values;
      await atualizarPerfil(patch);
      await queryClient.invalidateQueries({ queryKey: ["perfil"] });
      toast.success("Perfil atualizado");
      form.reset(values);
    } catch (e) {
      for (const [field, messages] of Object.entries((e as ApiError).fieldErrors ?? {})) {
        if (messages?.[0] && field in form.getValues()) {
          form.setError(field as keyof OrgForm, { type: "server", message: messages[0] }, { shouldFocus: true });
        }
      }
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    }
  });

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Meu perfil</h1>
      <p className="mt-1 text-sm text-muted-foreground">Atualize seus dados de organização.</p>

      <ProfileImageEditor perfil={perfil} />
      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <section className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
          <Field
            id="razaoSocial"
            label="Razão social / nome público"
            error={form.formState.errors.razaoSocial?.message}
          >
            <Input id="razaoSocial" maxLength={160} {...form.register("razaoSocial")} />
          </Field>
          <Field id="cnpj" label="CNPJ (identificador da conta)">
            <Input id="cnpj" value={perfil.cnpj ?? ""} readOnly disabled />
          </Field>
          <Field
            id="responsavelNome"
            label="Responsável"
            error={form.formState.errors.responsavelNome?.message}
          >
            <Input id="responsavelNome" maxLength={120} {...form.register("responsavelNome")} />
          </Field>
          <Field
            id="capacidadeMaxima"
            label="Capacidade máxima"
            error={form.formState.errors.capacidadeMaxima?.message as string | undefined}
          >
            <Input
              id="capacidadeMaxima"
              type="number"
              min={0}
              max={10000}
              step={1}
              {...form.register("capacidadeMaxima", {
                setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
              })}
            />
          </Field>
          <Field id="email" label="E-mail" error={form.formState.errors.email?.message}>
            <Input id="email" type="email" maxLength={254} {...form.register("email")} />
          </Field>
          <Field id="telefone" label="Telefone" error={form.formState.errors.telefone?.message}>
            <Input id="telefone" type="tel" maxLength={16} {...form.register("telefone")} />
          </Field>
          <Field id="endereco" label="Endereço" error={form.formState.errors.endereco?.message}>
            <Input id="endereco" maxLength={200} {...form.register("endereco")} />
          </Field>
          <Field id="cidade" label="Cidade" error={form.formState.errors.cidade?.message}>
            <Input id="cidade" readOnly disabled {...form.register("cidade")} />
          </Field>
          <Field id="estado" label="Estado (UF)" error={form.formState.errors.estado?.message}>
            <Input id="estado" maxLength={2} readOnly disabled {...form.register("estado")} />
          </Field>
          <Field
            id="descricao"
            label="Descrição pública"
            error={form.formState.errors.descricao?.message}
          >
            <Textarea id="descricao" rows={5} maxLength={500} {...form.register("descricao")} />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Cole links completos com <span className="font-medium text-foreground">https://</span>{" "}
              para exibir Linktree, Instagram ou site como link clicável no perfil.{" "}
              {form.watch("descricao").length}/500 caracteres
            </p>
          </Field>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar alterações"}
          </Button>
          {form.formState.isDirty && !form.formState.isSubmitting && (
            <span className="text-xs text-muted-foreground">Alterações não salvas</span>
          )}
        </div>
      </form>
    </div>
  );
}

function AcoProfile({ perfil }: { perfil: PerfilDTO }) {
  const queryClient = useQueryClient();
  const form = useForm<AcoForm>({
    resolver: zodResolver(acoSchema),
    defaultValues: {
      nomeCompleto: perfil.nomeCompleto ?? "",
      email: perfil.email,
      telefone: perfil.telefone ?? "",
      endereco: perfil.endereco ?? "",
      cidade: perfil.cidade ?? "",
      estado: perfil.estado ?? "",
      capacidadeAtual: perfil.capacidadeAtual ?? 0,
      descricao: perfil.descricao ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const { cidade: _cidade, estado: _estado, ...patch } = values;
      await atualizarPerfil(patch);
      await queryClient.invalidateQueries({ queryKey: ["perfil"] });
      toast.success("Perfil atualizado");
      form.reset(values);
    } catch (e) {
      for (const [field, messages] of Object.entries((e as ApiError).fieldErrors ?? {})) {
        if (messages?.[0] && field in form.getValues()) {
          form.setError(field as keyof AcoForm, { type: "server", message: messages[0] }, { shouldFocus: true });
        }
      }
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    }
  });

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Meu perfil</h1>
      <p className="mt-1 text-sm text-muted-foreground">Atualize seus dados de acolhedor.</p>

      <ProfileImageEditor perfil={perfil} />
      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <section className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
          <Field
            id="nomeCompleto"
            label="Nome completo / nome público"
            error={form.formState.errors.nomeCompleto?.message}
          >
            <Input id="nomeCompleto" maxLength={120} {...form.register("nomeCompleto")} />
          </Field>
          <Field id="cpf" label="CPF (identificador da conta)">
            <Input id="cpf" value={perfil.cpf ?? ""} readOnly disabled />
          </Field>
          <Field
            id="capacidadeAtual"
            label="Capacidade de acolhimento"
            error={form.formState.errors.capacidadeAtual?.message}
          >
            <Input
              id="capacidadeAtual"
              type="number"
              min={0}
              max={10000}
              step={1}
              {...form.register("capacidadeAtual")}
            />
          </Field>
          <Field id="email" label="E-mail" error={form.formState.errors.email?.message}>
            <Input id="email" type="email" maxLength={254} {...form.register("email")} />
          </Field>
          <Field id="telefone" label="Telefone" error={form.formState.errors.telefone?.message}>
            <Input id="telefone" type="tel" maxLength={16} {...form.register("telefone")} />
          </Field>
          <Field id="endereco" label="Endereço" error={form.formState.errors.endereco?.message}>
            <Input id="endereco" maxLength={200} {...form.register("endereco")} />
          </Field>
          <Field id="cidade" label="Cidade" error={form.formState.errors.cidade?.message}>
            <Input id="cidade" readOnly disabled {...form.register("cidade")} />
          </Field>
          <Field id="estado" label="Estado (UF)" error={form.formState.errors.estado?.message}>
            <Input id="estado" maxLength={2} readOnly disabled {...form.register("estado")} />
          </Field>
          <Field
            id="descricao"
            label="Descrição pública"
            error={form.formState.errors.descricao?.message}
          >
            <Textarea id="descricao" rows={5} maxLength={500} {...form.register("descricao")} />
            <p className="text-xs text-muted-foreground">
              {form.watch("descricao").length}/500 caracteres
            </p>
          </Field>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar alterações"}
          </Button>
          {form.formState.isDirty && !form.formState.isSubmitting && (
            <span className="text-xs text-muted-foreground">Alterações não salvas</span>
          )}
        </div>
      </form>
    </div>
  );
}
