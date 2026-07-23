import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Upload, Trash2 } from "lucide-react";

import { useDbVersion, useSessao } from "@/lib/data/hooks";
import {
  atualizarAcolhedor,
  atualizarOrganizacao,
  getAcolhedor,
  getOrganizacao,
} from "@/lib/data/usuarios";
import { buildSessao, setSessao } from "@/lib/data/sessao";
import { compressImageToDataUrl, isQuotaExceeded, QUOTA_MESSAGE } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/dashboard/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — AdoptPlace" },
      { name: "description", content: "Atualize seus dados de conta." },
    ],
  }),
  component: Page,
});

const orgSchema = z.object({
  razaoSocial: z.string().trim().min(2, "Informe a razão social").max(120),
  responsavelNome: z.string().trim().min(2, "Informe o responsável").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  telefone: z.string().trim().min(8, "Telefone inválido").max(20),
  endereco: z.string().trim().min(3, "Informe o endereço").max(200),
  cidade: z.string().trim().min(2, "Informe a cidade").max(80),
  estado: z.string().trim().length(2, "UF com 2 letras"),
  capacidadeMaxima: z.number().int().nonnegative().nullable().optional(),
});
type OrgForm = z.infer<typeof orgSchema>;

const acoSchema = z.object({
  nomeCompleto: z.string().trim().min(2, "Informe o nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  telefone: z.string().trim().min(8, "Telefone inválido").max(20),
  endereco: z.string().trim().min(3, "Informe o endereço").max(200),
  cidade: z.string().trim().min(2, "Informe a cidade").max(80),
  estado: z.string().trim().length(2, "UF com 2 letras"),
  capacidadeAtual: z.coerce.number().int().nonnegative(),
});
type AcoForm = z.infer<typeof acoSchema>;

function Page() {
  useDbVersion();
  const s = useSessao();
  const navigate = useNavigate();

  useEffect(() => {
    if (s && s.tipoPerfil !== "ORGANIZACAO" && s.tipoPerfil !== "ACOLHEDOR") {
      navigate({ to: "/dashboard" });
    }
  }, [s, navigate]);

  if (!s) return null;
  if (s.tipoPerfil === "ORGANIZACAO" && s.organizacaoId) {
    return <OrgProfile orgId={s.organizacaoId} usuarioId={s.usuarioId} />;
  }
  if (s.tipoPerfil === "ACOLHEDOR" && s.acolhedorId) {
    return <AcoProfile acoId={s.acolhedorId} usuarioId={s.usuarioId} />;
  }
  return null;
}

function PhotoField({
  value,
  onChange,
  fallback,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  fallback: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const handle = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await compressImageToDataUrl(file);
      onChange(url);
    } catch (e) {
      toast.error(isQuotaExceeded(e) ? QUOTA_MESSAGE : e instanceof Error ? e.message : "Erro");
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <div className="flex items-center gap-4">
      <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full border bg-muted text-lg font-medium text-muted-foreground">
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : fallback}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => ref.current?.click()}
        >
          <Upload className="mr-1 h-4 w-4" />
          {uploading ? "Enviando..." : value ? "Substituir" : "Enviar foto"}
        </Button>
        {value && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => onChange(null)}
          >
            <Trash2 className="mr-1 h-4 w-4" /> Remover
          </Button>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handle(e.target.files?.[0])}
        />
      </div>
    </div>
  );
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

function OrgProfile({ orgId, usuarioId }: { orgId: string; usuarioId: string }) {
  const org = getOrganizacao(orgId);
  const initials = useMemo(
    () => (org?.razaoSocial ?? "?").slice(0, 2).toUpperCase(),
    [org?.razaoSocial],
  );
  const [foto, setFoto] = useState<string | null>(org?.fotoUrl ?? null);
  const [saving, setSaving] = useState(false);

  const form = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      razaoSocial: org?.razaoSocial ?? "",
      responsavelNome: org?.responsavelNome ?? "",
      email: "",
      telefone: org?.telefone ?? "",
      endereco: org?.endereco ?? "",
      cidade: org?.cidade ?? "",
      estado: org?.estado ?? "",
      capacidadeMaxima: org?.capacidadeMaxima ?? null,
    },
  });

  useEffect(() => {
    // hydrate email from session (avoids empty flash before storage read)
    if (!form.getValues("email")) {
      import("@/lib/data/sessao").then(({ getSessao }) => {
        const s = getSessao();
        if (s) form.setValue("email", s.email);
      });
    }
  }, [form]);

  if (!org) return <p className="text-muted-foreground">Perfil não encontrado.</p>;

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true);
    try {
      atualizarOrganizacao(orgId, { ...values, fotoUrl: foto });
      setSessao(buildSessao(usuarioId));
      toast.success("Perfil atualizado");
      form.reset(values);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  });

  const dirty = form.formState.isDirty || foto !== (org.fotoUrl ?? null);

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Meu perfil</h1>
      <p className="mt-1 text-sm text-muted-foreground">Atualize seus dados de organização.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <section className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 font-medium">Logotipo</h2>
          <PhotoField value={foto} onChange={setFoto} fallback={initials} />
        </section>

        <section className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
          <Field id="razaoSocial" label="Razão social / nome público" error={form.formState.errors.razaoSocial?.message}>
            <Input id="razaoSocial" {...form.register("razaoSocial")} />
          </Field>
          <Field id="cnpj" label="CNPJ (identificador da conta)">
            <Input id="cnpj" value={org.cnpj} readOnly disabled />
          </Field>
          <Field id="responsavelNome" label="Responsável" error={form.formState.errors.responsavelNome?.message}>
            <Input id="responsavelNome" {...form.register("responsavelNome")} />
          </Field>
          <Field id="capacidadeMaxima" label="Capacidade máxima" error={form.formState.errors.capacidadeMaxima?.message as string | undefined}>
            <Input id="capacidadeMaxima" type="number" min={0} {...form.register("capacidadeMaxima", { setValueAs: (v) => (v === "" || v == null ? null : Number(v)) })} />
          </Field>
          <Field id="email" label="E-mail" error={form.formState.errors.email?.message}>
            <Input id="email" type="email" {...form.register("email")} />
          </Field>
          <Field id="telefone" label="Telefone" error={form.formState.errors.telefone?.message}>
            <Input id="telefone" {...form.register("telefone")} />
          </Field>
          <Field id="endereco" label="Endereço" error={form.formState.errors.endereco?.message}>
            <Input id="endereco" {...form.register("endereco")} />
          </Field>
          <Field id="cidade" label="Cidade" error={form.formState.errors.cidade?.message}>
            <Input id="cidade" {...form.register("cidade")} />
          </Field>
          <Field id="estado" label="Estado (UF)" error={form.formState.errors.estado?.message}>
            <Input id="estado" maxLength={2} {...form.register("estado")} />
          </Field>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving || !dirty}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
          {dirty && !saving && (
            <span className="text-xs text-muted-foreground">Alterações não salvas</span>
          )}
        </div>
      </form>
    </div>
  );
}

function AcoProfile({ acoId, usuarioId }: { acoId: string; usuarioId: string }) {
  const aco = getAcolhedor(acoId);
  const initials = useMemo(
    () => (aco?.nomeCompleto ?? "?").slice(0, 2).toUpperCase(),
    [aco?.nomeCompleto],
  );
  const [foto, setFoto] = useState<string | null>(aco?.fotoUrl ?? null);
  const [saving, setSaving] = useState(false);

  const form = useForm<AcoForm>({
    resolver: zodResolver(acoSchema),
    defaultValues: {
      nomeCompleto: aco?.nomeCompleto ?? "",
      email: "",
      telefone: aco?.telefone ?? "",
      endereco: aco?.endereco ?? "",
      cidade: aco?.cidade ?? "",
      estado: aco?.estado ?? "",
      capacidadeAtual: aco?.capacidadeAtual ?? 0,
    },
  });

  useEffect(() => {
    if (!form.getValues("email")) {
      import("@/lib/data/sessao").then(({ getSessao }) => {
        const s = getSessao();
        if (s) form.setValue("email", s.email);
      });
    }
  }, [form]);

  if (!aco) return <p className="text-muted-foreground">Perfil não encontrado.</p>;

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true);
    try {
      atualizarAcolhedor(acoId, { ...values, fotoUrl: foto });
      setSessao(buildSessao(usuarioId));
      toast.success("Perfil atualizado");
      form.reset(values);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  });

  const dirty = form.formState.isDirty || foto !== (aco.fotoUrl ?? null);

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Meu perfil</h1>
      <p className="mt-1 text-sm text-muted-foreground">Atualize seus dados de acolhedor.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <section className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 font-medium">Foto</h2>
          <PhotoField value={foto} onChange={setFoto} fallback={initials} />
        </section>

        <section className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
          <Field id="nomeCompleto" label="Nome completo / nome público" error={form.formState.errors.nomeCompleto?.message}>
            <Input id="nomeCompleto" {...form.register("nomeCompleto")} />
          </Field>
          <Field id="cpf" label="CPF (identificador da conta)">
            <Input id="cpf" value={aco.cpf} readOnly disabled />
          </Field>
          <Field id="capacidadeAtual" label="Capacidade de acolhimento" error={form.formState.errors.capacidadeAtual?.message}>
            <Input id="capacidadeAtual" type="number" min={0} {...form.register("capacidadeAtual")} />
          </Field>
          <Field id="email" label="E-mail" error={form.formState.errors.email?.message}>
            <Input id="email" type="email" {...form.register("email")} />
          </Field>
          <Field id="telefone" label="Telefone" error={form.formState.errors.telefone?.message}>
            <Input id="telefone" {...form.register("telefone")} />
          </Field>
          <Field id="endereco" label="Endereço" error={form.formState.errors.endereco?.message}>
            <Input id="endereco" {...form.register("endereco")} />
          </Field>
          <Field id="cidade" label="Cidade" error={form.formState.errors.cidade?.message}>
            <Input id="cidade" {...form.register("cidade")} />
          </Field>
          <Field id="estado" label="Estado (UF)" error={form.formState.errors.estado?.message}>
            <Input id="estado" maxLength={2} {...form.register("estado")} />
          </Field>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving || !dirty}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
          {dirty && !saving && (
            <span className="text-xs text-muted-foreground">Alterações não salvas</span>
          )}
        </div>
      </form>
    </div>
  );
}
