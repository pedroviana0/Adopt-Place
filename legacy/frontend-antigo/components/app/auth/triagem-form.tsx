"use client";

import { useActionState } from "react";

import { saveScreening } from "@/lib/actions/triagem";
import { initialFormState } from "@/lib/actions/form-state";
import type { AdopterDashboard } from "@/lib/queries/adotante-dashboard";
import { Alert, Button, Form, FormItem, FormLabel, Input, Select } from "@/components/ui";

type TriagemFormProps = {
  adopter: AdopterDashboard;
};

const booleanOptions = [
  { value: "", label: "Selecione" },
  { value: "true", label: "Sim" },
  { value: "false", label: "Nao" },
];

function FieldError({ name, errors }: { name: string; errors?: Record<string, string[]> }) {
  const message = errors?.[name]?.[0];
  return message ? <p className="text-sm text-[var(--destructive)]">{message}</p> : null;
}

function BooleanSelect({
  id,
  label,
  defaultValue,
  errors,
}: {
  id: keyof AdopterDashboard;
  label: string;
  defaultValue: boolean | null;
  errors?: Record<string, string[]>;
}) {
  return (
    <FormItem>
      <FormLabel htmlFor={id}>{label}</FormLabel>
      <Select id={id} name={id} defaultValue={defaultValue === null ? "" : String(defaultValue)}>
        {booleanOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <FieldError name={id} errors={errors} />
    </FormItem>
  );
}

function TextField({
  id,
  label,
  defaultValue,
  errors,
}: {
  id: keyof AdopterDashboard;
  label: string;
  defaultValue: string | number | null;
  errors?: Record<string, string[]>;
}) {
  return (
    <FormItem>
      <FormLabel htmlFor={id}>{label}</FormLabel>
      <Input id={id} name={id} defaultValue={defaultValue ?? ""} />
      <FieldError name={id} errors={errors} />
    </FormItem>
  );
}

export function TriagemForm({ adopter }: TriagemFormProps) {
  const [state, action, pending] = useActionState(saveScreening, initialFormState);

  return (
    <Form action={action} className="space-y-6">
      {state.message ? (
        <Alert variant={state.ok ? "default" : "destructive"}>{state.message}</Alert>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <TextField
          id="motivoAdocao"
          label="Motivo da adocao"
          defaultValue={adopter.motivoAdocao}
          errors={state.fieldErrors}
        />
        <TextField
          id="tipoAnimalDesejado"
          label="Tipo de animal desejado"
          defaultValue={adopter.tipoAnimalDesejado}
          errors={state.fieldErrors}
        />
        <BooleanSelect
          id="podeArcarCustosVet"
          label="Pode arcar com custos veterinarios?"
          defaultValue={adopter.podeArcarCustosVet}
          errors={state.fieldErrors}
        />
        <BooleanSelect
          id="adocaoParaPresente"
          label="A adocao e para presente?"
          defaultValue={adopter.adocaoParaPresente}
          errors={state.fieldErrors}
        />
        <TextField
          id="adocaoParaPresenteDetalhe"
          label="Detalhe sobre presente"
          defaultValue={adopter.adocaoParaPresenteDetalhe}
          errors={state.fieldErrors}
        />
        <FormItem>
          <FormLabel htmlFor="tipoMoradia">Tipo de moradia</FormLabel>
          <Select id="tipoMoradia" name="tipoMoradia" defaultValue={adopter.tipoMoradia ?? ""}>
            <option value="">Selecione</option>
            <option value="CASA">Casa</option>
            <option value="APARTAMENTO">Apartamento</option>
            <option value="SITIO_FAZENDA">Sitio/Fazenda</option>
          </Select>
          <FieldError name="tipoMoradia" errors={state.fieldErrors} />
        </FormItem>
        <BooleanSelect
          id="moradiaPropria"
          label="Moradia propria?"
          defaultValue={adopter.moradiaPropria}
          errors={state.fieldErrors}
        />
        <TextField
          id="numAdultosCasa"
          label="Numero de adultos na casa"
          defaultValue={adopter.numAdultosCasa}
          errors={state.fieldErrors}
        />
        <BooleanSelect
          id="temCriancas"
          label="Tem criancas?"
          defaultValue={adopter.temCriancas}
          errors={state.fieldErrors}
        />
        <TextField
          id="criancasFaixaEtaria"
          label="Faixa etaria das criancas"
          defaultValue={adopter.criancasFaixaEtaria}
          errors={state.fieldErrors}
        />
        <BooleanSelect
          id="todosConordamAdocao"
          label="Todos concordam com a adocao?"
          defaultValue={adopter.todosConordamAdocao}
          errors={state.fieldErrors}
        />
        <TextField
          id="condominioPermiteAnimal"
          label="Condominio permite animal?"
          defaultValue={adopter.condominioPermiteAnimal}
          errors={state.fieldErrors}
        />
        <BooleanSelect
          id="janelasTeladas"
          label="Janelas teladas?"
          defaultValue={adopter.janelasTeladas}
          errors={state.fieldErrors}
        />
        <TextField id="acessoRua" label="Acesso a rua" defaultValue={adopter.acessoRua} errors={state.fieldErrors} />
        <BooleanSelect
          id="murosSeguros"
          label="Muros seguros?"
          defaultValue={adopter.murosSeguros}
          errors={state.fieldErrors}
        />
        <TextField
          id="horasSozinho"
          label="Horas que o animal ficara sozinho"
          defaultValue={adopter.horasSozinho}
          errors={state.fieldErrors}
        />
        <TextField
          id="responsavelViagem"
          label="Responsavel em viagens"
          defaultValue={adopter.responsavelViagem}
          errors={state.fieldErrors}
        />
        <TextField
          id="planoEmGravidez"
          label="Plano em caso de gravidez"
          defaultValue={adopter.planoEmGravidez}
          errors={state.fieldErrors}
        />
        <BooleanSelect
          id="alergicosNaCasa"
          label="Ha alergicos na casa?"
          defaultValue={adopter.alergicosNaCasa}
          errors={state.fieldErrors}
        />
        <TextField
          id="alergicosNaCasaDetalhe"
          label="Detalhes sobre alergias"
          defaultValue={adopter.alergicosNaCasaDetalhe}
          errors={state.fieldErrors}
        />
        <TextField
          id="planoMudanca"
          label="Plano em caso de mudanca"
          defaultValue={adopter.planoMudanca}
          errors={state.fieldErrors}
        />
        <TextField
          id="historicoDevolucao"
          label="Historico de devolucao"
          defaultValue={adopter.historicoDevolucao}
          errors={state.fieldErrors}
        />
        <TextField
          id="historicoPercaDescuido"
          label="Historico de perda ou descuido"
          defaultValue={adopter.historicoPercaDescuido}
          errors={state.fieldErrors}
        />
        <BooleanSelect
          id="cienteLongevidade"
          label="Ciente da longevidade?"
          defaultValue={adopter.cienteLongevidade}
          errors={state.fieldErrors}
        />
        <BooleanSelect
          id="permiteVisitaProtetor"
          label="Permite visita do protetor?"
          defaultValue={adopter.permiteVisitaProtetor}
          errors={state.fieldErrors}
        />
        <BooleanSelect
          id="ciendeNaoRepassar"
          label="Ciente de nao repassar o animal?"
          defaultValue={adopter.ciendeNaoRepassar}
          errors={state.fieldErrors}
        />
        <BooleanSelect
          id="teveAnimaisAntes"
          label="Teve animais antes?"
          defaultValue={adopter.teveAnimaisAntes}
          errors={state.fieldErrors}
        />
        <TextField
          id="animaisAnterioresDescricao"
          label="Descricao dos animais anteriores"
          defaultValue={adopter.animaisAnterioresDescricao}
          errors={state.fieldErrors}
        />
        <BooleanSelect
          id="temOutrosAnimais"
          label="Tem outros animais?"
          defaultValue={adopter.temOutrosAnimais}
          errors={state.fieldErrors}
        />
        <TextField
          id="outrosAnimaisDescricao"
          label="Descricao dos outros animais"
          defaultValue={adopter.outrosAnimaisDescricao}
          errors={state.fieldErrors}
        />
      </section>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar triagem"}
      </Button>
    </Form>
  );
}
