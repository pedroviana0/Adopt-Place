import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CadastroField } from "@/components/app/CadastroVisual";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApiError } from "@/lib/data/api";
import {
  larTemporarioFormSchema,
  type LarTemporarioFormValues,
  type LarTemporarioUpdateInput,
} from "@/lib/schemas/larTemporario";

// Cadastro e edicao de lar temporario (spec 009, RF-022). Campos provisorios
// ate o formulario da Cia Animal (C1). A autorizacao do tutor so aparece no
// cadastro e nao e guardada (C3).
export function LarTemporarioForm({
  mode,
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  defaultValues?: Partial<LarTemporarioUpdateInput>;
  submitLabel: string;
  onSubmit: (values: LarTemporarioUpdateInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const f = useForm<LarTemporarioFormValues>({
    resolver: zodResolver(larTemporarioFormSchema(mode)),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      nomeTutor: defaultValues?.nomeTutor ?? "",
      telefone: defaultValues?.telefone ?? "",
      endereco: defaultValues?.endereco ?? "",
      cidade: defaultValues?.cidade ?? "",
      observacoes: defaultValues?.observacoes ?? "",
      autorizacaoTutor: false,
    },
  });
  const errors = f.formState.errors;

  const submit = async ({ autorizacaoTutor: _autorizacao, ...values }: LarTemporarioFormValues) => {
    try {
      await onSubmit(values);
    } catch (error) {
      let mapped = false;
      for (const [field, messages] of Object.entries((error as ApiError).fieldErrors ?? {})) {
        if (messages?.[0]) {
          mapped = true;
          f.setError(field as keyof LarTemporarioFormValues, { type: "server", message: messages[0] });
        }
      }
      if (!mapped) toast.error(error instanceof Error ? error.message : "Erro ao salvar");
    }
  };

  return (
    <form noValidate onSubmit={f.handleSubmit(submit)} className="space-y-4">
      <CadastroField label="Nome do tutor" htmlFor="lt-nome" error={errors.nomeTutor?.message}>
        <Input
          id="lt-nome"
          maxLength={120}
          autoComplete="off"
          aria-invalid={Boolean(errors.nomeTutor)}
          {...f.register("nomeTutor")}
        />
      </CadastroField>
      <CadastroField label="Telefone" htmlFor="lt-telefone" error={errors.telefone?.message}>
        <Input
          id="lt-telefone"
          type="tel"
          maxLength={16}
          autoComplete="off"
          aria-invalid={Boolean(errors.telefone)}
          {...f.register("telefone")}
        />
      </CadastroField>
      <CadastroField label="Endereço" htmlFor="lt-endereco" error={errors.endereco?.message}>
        <Input
          id="lt-endereco"
          maxLength={200}
          autoComplete="off"
          placeholder="Rua, número e complemento"
          aria-invalid={Boolean(errors.endereco)}
          {...f.register("endereco")}
        />
      </CadastroField>
      <CadastroField label="Cidade" htmlFor="lt-cidade" error={errors.cidade?.message}>
        <Input
          id="lt-cidade"
          maxLength={80}
          autoComplete="off"
          aria-invalid={Boolean(errors.cidade)}
          {...f.register("cidade")}
        />
      </CadastroField>
      <CadastroField
        label="Observações (opcional)"
        htmlFor="lt-observacoes"
        error={errors.observacoes?.message}
      >
        <Textarea
          id="lt-observacoes"
          rows={3}
          maxLength={1000}
          aria-invalid={Boolean(errors.observacoes)}
          {...f.register("observacoes")}
        />
      </CadastroField>
      {mode === "create" && (
        <div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="lt-autorizacao"
              checked={f.watch("autorizacaoTutor")}
              onCheckedChange={(v) =>
                f.setValue("autorizacaoTutor", v === true, { shouldValidate: true })
              }
              aria-invalid={Boolean(errors.autorizacaoTutor)}
              aria-describedby={errors.autorizacaoTutor ? "lt-autorizacao-error" : undefined}
            />
            <Label htmlFor="lt-autorizacao" className="leading-snug">
              O tutor temporário autorizou o registro destes dados na plataforma.
            </Label>
          </div>
          {errors.autorizacaoTutor && (
            <p id="lt-autorizacao-error" role="alert" className="mt-1 text-xs text-destructive">
              {errors.autorizacaoTutor.message}
            </p>
          )}
        </div>
      )}
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={f.formState.isSubmitting}>
          {f.formState.isSubmitting ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
