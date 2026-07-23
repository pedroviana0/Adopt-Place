import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { triagemSchema, type TriagemInput } from "@/lib/schemas/triagem";
import { useSessao } from "@/lib/data/hooks";
import { getAdotante, salvarTriagem } from "@/lib/data/usuarios";
import { toast } from "sonner";
import { TipoMoradia } from "@/lib/domain/enums";

export const Route = createFileRoute("/_authenticated/triagem")({
  head: () => ({ meta: [{ title: "Triagem — AdoptPlace" }, { name: "description", content: "Preencha a triagem obrigatória para adotar." }] }),
  component: TriagemPage,
});

function TriagemPage() {
  const sessao = useSessao();
  const navigate = useNavigate();
  const adotante = sessao?.adotanteId ? getAdotante(sessao.adotanteId) : undefined;

  const form = useForm<TriagemInput>({
    resolver: zodResolver(triagemSchema),
    defaultValues: adotante
      ? {
          motivoAdocao: adotante.motivoAdocao ?? "",
          tipoAnimalDesejado: adotante.tipoAnimalDesejado ?? "",
          podeArcarCustosVet: adotante.podeArcarCustosVet ?? false,
          adocaoParaPresente: adotante.adocaoParaPresente ?? false,
          tipoMoradia: adotante.tipoMoradia ?? TipoMoradia.APARTAMENTO,
          moradiaPropria: adotante.moradiaPropria ?? false,
          numAdultosCasa: adotante.numAdultosCasa ?? 1,
          temCriancas: adotante.temCriancas ?? false,
          todosConcordamAdocao: adotante.todosConcordamAdocao ?? false,
          janelasTeladas: adotante.janelasTeladas ?? false,
          acessoRua: adotante.acessoRua ?? "",
          murosSeguros: adotante.murosSeguros ?? false,
          horasSozinho: adotante.horasSozinho ?? "",
          responsavelViagem: adotante.responsavelViagem ?? "",
          planoEmGravidez: adotante.planoEmGravidez ?? "",
          alergicosNaCasa: adotante.alergicosNaCasa ?? false,
          planoMudanca: adotante.planoMudanca ?? "",
          cienteLongevidade: adotante.cienteLongevidade ?? false,
          permiteVisitaProtetor: adotante.permiteVisitaProtetor ?? false,
          cienteNaoRepassar: adotante.cienteNaoRepassar ?? false,
          teveAnimaisAntes: adotante.teveAnimaisAntes ?? false,
          temOutrosAnimais: adotante.temOutrosAnimais ?? false,
        }
      : undefined,
  });

  if (!sessao || sessao.tipoPerfil !== "ADOTANTE" || !adotante) {
    return <div className="mx-auto max-w-xl px-4 py-10 text-muted-foreground">Área exclusiva de adotantes.</div>;
  }

  const onSubmit = (d: TriagemInput) => {
    try {
      salvarTriagem(adotante.id, d);
      toast.success("Triagem concluída! Você já pode solicitar adoções.");
      navigate({ to: "/minhas-solicitacoes" });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao salvar"); }
  };

  const bool = (name: keyof TriagemInput, label: string) => (
    <div className="flex items-center justify-between gap-4 rounded-md border p-3">
      <Label className="text-sm">{label}</Label>
      <RadioGroup
        className="flex gap-4"
        value={form.watch(name) === true ? "sim" : form.watch(name) === false ? "nao" : ""}
        onValueChange={(v) => form.setValue(name, v === "sim" as never)}
      >
        <div className="flex items-center gap-1"><RadioGroupItem value="sim" id={`${name}-s`} /><Label htmlFor={`${name}-s`}>Sim</Label></div>
        <div className="flex items-center gap-1"><RadioGroupItem value="nao" id={`${name}-n`} /><Label htmlFor={`${name}-n`}>Não</Label></div>
      </RadioGroup>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold">Triagem de adotante</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Formulário único e padronizado. Você pode editar as respostas depois.
      </p>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div><Label>Motivo da adoção</Label><Textarea rows={3} {...form.register("motivoAdocao")} />{form.formState.errors.motivoAdocao && <p className="mt-1 text-xs text-destructive">{form.formState.errors.motivoAdocao.message}</p>}</div>
        <div><Label>Tipo de animal desejado</Label><Input {...form.register("tipoAnimalDesejado")} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Tipo de moradia</Label>
            <Select value={form.watch("tipoMoradia")} onValueChange={(v) => form.setValue("tipoMoradia", v as TipoMoradia)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TipoMoradia.CASA}>Casa</SelectItem>
                <SelectItem value={TipoMoradia.APARTAMENTO}>Apartamento</SelectItem>
                <SelectItem value={TipoMoradia.SITIO_FAZENDA}>Sítio/Fazenda</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Nº de adultos na casa</Label><Input type="number" min={1} {...form.register("numAdultosCasa", { valueAsNumber: true })} /></div>
        </div>
        {bool("podeArcarCustosVet", "Pode arcar com custos veterinários?")}
        {bool("adocaoParaPresente", "É adoção para presentear alguém?")}
        {bool("moradiaPropria", "Moradia própria?")}
        {bool("temCriancas", "Há crianças na casa?")}
        {bool("todosConcordamAdocao", "Todos concordam com a adoção?")}
        {bool("janelasTeladas", "Janelas teladas / com proteção?")}
        {bool("murosSeguros", "Muros e portões seguros?")}
        {bool("alergicosNaCasa", "Alguém alérgico na casa?")}
        {bool("cienteLongevidade", "Ciente da longevidade do animal?")}
        {bool("permiteVisitaProtetor", "Permite visita do protetor?")}
        {bool("cienteNaoRepassar", "Ciente de que não pode repassar o animal?")}
        {bool("teveAnimaisAntes", "Já teve animais antes?")}
        {bool("temOutrosAnimais", "Tem outros animais atualmente?")}
        <div><Label>Como será o acesso à rua?</Label><Input {...form.register("acessoRua")} /></div>
        <div><Label>Horas sozinho por dia</Label><Input {...form.register("horasSozinho")} /></div>
        <div><Label>Responsável em caso de viagem</Label><Input {...form.register("responsavelViagem")} /></div>
        <div><Label>Plano em caso de gravidez na família</Label><Input {...form.register("planoEmGravidez")} /></div>
        <div><Label>Plano em caso de mudança</Label><Input {...form.register("planoMudanca")} /></div>
        <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar triagem"}
        </Button>
      </form>
    </div>
  );
}
