import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { triagemSchema, type TriagemInput } from "@/lib/schemas/triagem";
import { useSessao } from "@/lib/data/hooks";
import { fetchTriagem, salvarTriagem } from "@/lib/data/usuarios";
import { toast } from "sonner";
import { TipoMoradia } from "@/lib/domain/enums";
import { AsyncState } from "@/components/app/AsyncState";
import { CheckCircle2, ClipboardCheck, HeartHandshake, Home, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/triagem")({
  head: () => ({
    meta: [
      { title: "Triagem — AdoptPlace" },
      { name: "description", content: "Preencha a triagem obrigatória para adotar." },
    ],
  }),
  component: TriagemPage,
});

function TriagemPage() {
  const sessao = useSessao();
  const navigate = useNavigate();
  const isAdopter = sessao?.tipoPerfil === "ADOTANTE";

  // Prefill from the real screening (GET /api/triagem); adopter-only endpoint.
  const triagem = useQuery({ queryKey: ["triagem"], queryFn: fetchTriagem, enabled: isAdopter });

  const form = useForm<TriagemInput>({ resolver: zodResolver(triagemSchema) });
  const { reset } = form;

  useEffect(() => {
    const t = triagem.data as Record<string, unknown> | undefined;
    if (!t) return;
    reset({
      motivoAdocao: (t.motivoAdocao as string) ?? "",
      tipoAnimalDesejado: (t.tipoAnimalDesejado as string) ?? "",
      podeArcarCustosVet: (t.podeArcarCustosVet as boolean) ?? false,
      adocaoParaPresente: (t.adocaoParaPresente as boolean) ?? false,
      tipoMoradia: (t.tipoMoradia as TipoMoradia) ?? TipoMoradia.APARTAMENTO,
      moradiaPropria: (t.moradiaPropria as boolean) ?? false,
      numAdultosCasa: (t.numAdultosCasa as number) ?? 1,
      temCriancas: (t.temCriancas as boolean) ?? false,
      // backend column carries a historical typo (todosConordamAdocao)
      todosConcordamAdocao: (t.todosConordamAdocao as boolean) ?? false,
      janelasTeladas: (t.janelasTeladas as boolean) ?? false,
      acessoRua: (t.acessoRua as string) ?? "",
      murosSeguros: (t.murosSeguros as boolean) ?? false,
      horasSozinho: (t.horasSozinho as string) ?? "",
      responsavelViagem: (t.responsavelViagem as string) ?? "",
      planoEmGravidez: (t.planoEmGravidez as string) ?? "",
      alergicosNaCasa: (t.alergicosNaCasa as boolean) ?? false,
      planoMudanca: (t.planoMudanca as string) ?? "",
      historicoDevolucao: (t.historicoDevolucao as string) ?? "",
      historicoPercaDescuido: (t.historicoPercaDescuido as string) ?? "",
      cienteLongevidade: (t.cienteLongevidade as boolean) ?? false,
      permiteVisitaProtetor: (t.permiteVisitaProtetor as boolean) ?? false,
      // backend column carries a historical typo (ciendeNaoRepassar)
      cienteNaoRepassar: (t.ciendeNaoRepassar as boolean) ?? false,
      teveAnimaisAntes: (t.teveAnimaisAntes as boolean) ?? false,
      temOutrosAnimais: (t.temOutrosAnimais as boolean) ?? false,
    });
  }, [triagem.data, reset]);

  if (!sessao || !isAdopter) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 text-muted-foreground">
        Área exclusiva de adotantes.
      </div>
    );
  }

  const onSubmit = async (d: TriagemInput) => {
    try {
      await salvarTriagem(d);
      toast.success("Triagem concluída! Você já pode solicitar adoções.");
      navigate({ to: "/minhas-solicitacoes" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  const bool = (name: keyof TriagemInput, label: string) => (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-border bg-surface-subtle p-4 transition-colors focus-within:border-primary/60 sm:flex-row sm:items-center sm:justify-between">
      <legend className="px-1 text-sm font-medium">{label}</legend>
      <RadioGroup
        className="flex gap-4"
        aria-label={label}
        value={form.watch(name) === true ? "sim" : form.watch(name) === false ? "nao" : ""}
        onValueChange={(v) => form.setValue(name, v === ("sim" as never))}
      >
        <div className="flex items-center gap-1">
          <RadioGroupItem value="sim" id={`${name}-s`} />
          <Label htmlFor={`${name}-s`}>Sim</Label>
        </div>
        <div className="flex items-center gap-1">
          <RadioGroupItem value="nao" id={`${name}-n`} />
          <Label htmlFor={`${name}-n`}>Não</Label>
        </div>
      </RadioGroup>
    </fieldset>
  );

  if (triagem.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <AsyncState isLoading loadingLabel="Carregando sua triagem…">
          {null}
        </AsyncState>
      </div>
    );
  }

  if (triagem.isError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <AsyncState
          isLoading={false}
          isError
          error={triagem.error}
          errorTitle="Não foi possível carregar sua triagem"
          onRetry={() => triagem.refetch()}
        >
          {null}
        </AsyncState>
      </div>
    );
  }

  return (
    <main className="page-canvas min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <header className="grid gap-6 rounded-2xl border border-border bg-card/90 p-6 shadow-sm backdrop-blur md:grid-cols-[1fr_auto] md:items-center sm:p-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-selection px-3 py-1 text-xs font-semibold text-selection-foreground">
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              Etapa necessária para adotar
            </div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Triagem de adotante
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              Conte sobre sua rotina e o ambiente onde o animal viverá. Suas respostas ajudam os
              responsáveis a avaliar uma adoção segura e consciente.
            </p>
          </div>
          <div className="grid h-20 w-20 place-items-center rounded-2xl border border-primary/20 bg-surface-subtle text-primary md:h-24 md:w-24">
            <HeartHandshake className="h-10 w-10 md:h-12 md:w-12" aria-hidden="true" />
          </div>
        </header>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-surface-subtle px-4 py-3 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <p>
            <strong className="text-foreground">Suas informações são protegidas.</strong> A triagem
            pode ser revisada depois e só é compartilhada conforme as regras de privacidade da
            plataforma.
          </p>
        </div>

        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <FormSection
            icon={HeartHandshake}
            title="Sobre a adoção"
            description="O que você procura e por que deseja adotar."
          >
            <div>
              <Label htmlFor="motivoAdocao">Motivo da adoção</Label>
              <Textarea
                id="motivoAdocao"
                rows={3}
                aria-invalid={Boolean(form.formState.errors.motivoAdocao)}
                aria-describedby={
                  form.formState.errors.motivoAdocao ? "motivoAdocao-error" : undefined
                }
                {...form.register("motivoAdocao")}
              />
              <FieldError
                id="motivoAdocao-error"
                message={form.formState.errors.motivoAdocao?.message}
              />
            </div>
            <div>
              <Label htmlFor="tipoAnimalDesejado">Tipo de animal desejado</Label>
              <Input
                id="tipoAnimalDesejado"
                aria-invalid={Boolean(form.formState.errors.tipoAnimalDesejado)}
                aria-describedby={
                  form.formState.errors.tipoAnimalDesejado ? "tipoAnimalDesejado-error" : undefined
                }
                {...form.register("tipoAnimalDesejado")}
              />
              <FieldError
                id="tipoAnimalDesejado-error"
                message={form.formState.errors.tipoAnimalDesejado?.message}
              />
            </div>
          </FormSection>

          <FormSection
            icon={Home}
            title="Casa e convivência"
            description="Características do lar e de quem convive nele."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="tipoMoradia">Tipo de moradia</Label>
                <Select
                  value={form.watch("tipoMoradia")}
                  onValueChange={(v) => form.setValue("tipoMoradia", v as TipoMoradia)}
                >
                  <SelectTrigger
                    id="tipoMoradia"
                    aria-invalid={Boolean(form.formState.errors.tipoMoradia)}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TipoMoradia.CASA}>Casa</SelectItem>
                    <SelectItem value={TipoMoradia.APARTAMENTO}>Apartamento</SelectItem>
                    <SelectItem value={TipoMoradia.SITIO_FAZENDA}>Sítio/Fazenda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="numAdultosCasa">Nº de adultos na casa</Label>
                <Input
                  id="numAdultosCasa"
                  type="number"
                  min={1}
                  aria-invalid={Boolean(form.formState.errors.numAdultosCasa)}
                  aria-describedby={
                    form.formState.errors.numAdultosCasa ? "numAdultosCasa-error" : undefined
                  }
                  {...form.register("numAdultosCasa", { valueAsNumber: true })}
                />
                <FieldError
                  id="numAdultosCasa-error"
                  message={form.formState.errors.numAdultosCasa?.message}
                />
              </div>
            </div>
            {bool("podeArcarCustosVet", "Pode arcar com custos veterinários?")}
            {bool("adocaoParaPresente", "É adoção para presentear alguém?")}
            {bool("moradiaPropria", "Moradia própria?")}
            {bool("temCriancas", "Há crianças na casa?")}
            {bool("todosConcordamAdocao", "Todos concordam com a adoção?")}
            {bool("janelasTeladas", "Janelas teladas / com proteção?")}
            {bool("murosSeguros", "Muros e portões seguros?")}
            {bool("alergicosNaCasa", "Alguém alérgico na casa?")}
          </FormSection>

          <FormSection
            icon={ShieldCheck}
            title="Segurança e responsabilidade"
            description="Cuidados previstos para toda a vida do animal."
          >
            {bool("cienteLongevidade", "Ciente da longevidade do animal?")}
            {bool("permiteVisitaProtetor", "Permite visita do protetor?")}
            {bool("cienteNaoRepassar", "Ciente de que não pode repassar o animal?")}
            {bool("teveAnimaisAntes", "Já teve animais antes?")}
            {bool("temOutrosAnimais", "Tem outros animais atualmente?")}
            <div>
              <Label htmlFor="acessoRua">Como será o acesso à rua?</Label>
              <Input
                id="acessoRua"
                aria-invalid={Boolean(form.formState.errors.acessoRua)}
                aria-describedby={form.formState.errors.acessoRua ? "acessoRua-error" : undefined}
                {...form.register("acessoRua")}
              />
              <FieldError id="acessoRua-error" message={form.formState.errors.acessoRua?.message} />
            </div>
            <div>
              <Label htmlFor="horasSozinho">Horas sozinho por dia</Label>
              <Input
                id="horasSozinho"
                aria-invalid={Boolean(form.formState.errors.horasSozinho)}
                aria-describedby={
                  form.formState.errors.horasSozinho ? "horasSozinho-error" : undefined
                }
                {...form.register("horasSozinho")}
              />
              <FieldError
                id="horasSozinho-error"
                message={form.formState.errors.horasSozinho?.message}
              />
            </div>
          </FormSection>

          <FormSection
            icon={ClipboardCheck}
            title="Planos e histórico"
            description="Como você lidaria com mudanças e experiências anteriores."
          >
            <div>
              <Label htmlFor="responsavelViagem">Responsável em caso de viagem</Label>
              <Input
                id="responsavelViagem"
                aria-invalid={Boolean(form.formState.errors.responsavelViagem)}
                aria-describedby={
                  form.formState.errors.responsavelViagem ? "responsavelViagem-error" : undefined
                }
                {...form.register("responsavelViagem")}
              />
              <FieldError
                id="responsavelViagem-error"
                message={form.formState.errors.responsavelViagem?.message}
              />
            </div>
            <div>
              <Label htmlFor="planoEmGravidez">Plano em caso de gravidez na família</Label>
              <Input
                id="planoEmGravidez"
                aria-invalid={Boolean(form.formState.errors.planoEmGravidez)}
                aria-describedby={
                  form.formState.errors.planoEmGravidez ? "planoEmGravidez-error" : undefined
                }
                {...form.register("planoEmGravidez")}
              />
              <FieldError
                id="planoEmGravidez-error"
                message={form.formState.errors.planoEmGravidez?.message}
              />
            </div>
            <div>
              <Label htmlFor="planoMudanca">Plano em caso de mudança</Label>
              <Input
                id="planoMudanca"
                aria-invalid={Boolean(form.formState.errors.planoMudanca)}
                aria-describedby={
                  form.formState.errors.planoMudanca ? "planoMudanca-error" : undefined
                }
                {...form.register("planoMudanca")}
              />
              <FieldError
                id="planoMudanca-error"
                message={form.formState.errors.planoMudanca?.message}
              />
            </div>
            <div>
              <Label htmlFor="historicoDevolucao">Histórico de devolução de animais</Label>
              <Textarea
                id="historicoDevolucao"
                rows={2}
                aria-invalid={Boolean(form.formState.errors.historicoDevolucao)}
                aria-describedby={
                  form.formState.errors.historicoDevolucao ? "historicoDevolucao-error" : undefined
                }
                {...form.register("historicoDevolucao")}
              />
              <FieldError
                id="historicoDevolucao-error"
                message={form.formState.errors.historicoDevolucao?.message}
              />
            </div>
            <div>
              <Label htmlFor="historicoPercaDescuido">Histórico de perda/descuido de animais</Label>
              <Textarea
                id="historicoPercaDescuido"
                rows={2}
                aria-invalid={Boolean(form.formState.errors.historicoPercaDescuido)}
                aria-describedby={
                  form.formState.errors.historicoPercaDescuido
                    ? "historicoPercaDescuido-error"
                    : undefined
                }
                {...form.register("historicoPercaDescuido")}
              />
              <FieldError
                id="historicoPercaDescuido-error"
                message={form.formState.errors.historicoPercaDescuido?.message}
              />
            </div>
          </FormSection>

          <div className="sticky bottom-4 z-10 rounded-2xl border border-border bg-card/95 p-4 shadow-floating backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground sm:mb-0">
              <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
              Revise suas respostas antes de concluir.
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto sm:min-w-48"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Salvando…" : "Salvar triagem"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof ClipboardCheck;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3 border-b border-border/70 pb-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-subtle text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-serif text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-destructive">
      {message}
    </p>
  );
}
