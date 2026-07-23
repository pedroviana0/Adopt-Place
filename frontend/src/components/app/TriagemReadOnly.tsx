import type { Adotante } from "@/lib/domain/types";
import { tipoMoradiaLabel } from "@/lib/domain/enums";

interface Props { adotante: Adotante }

const yn = (v: boolean | null | undefined) => (v === true ? "Sim" : v === false ? "Não" : "—");
const tx = (v: string | null | undefined) => (v && v.trim() ? v : "—");

export function TriagemReadOnly({ adotante }: Props) {
  if (!adotante.triagemConcluida) {
    return (
      <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        Este adotante ainda não concluiu a triagem.
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <Section title="Identificação">
        <Row label="Nome" value={adotante.nomeCompleto} />
        <Row label="Cidade" value={`${adotante.cidade}/${adotante.estado}`} />
        <Row label="Telefone" value={adotante.telefone} />
      </Section>
      <Section title="Motivação e perfil buscado">
        <Row label="Motivo da adoção" value={tx(adotante.motivoAdocao)} />
        <Row label="Tipo de animal desejado" value={tx(adotante.tipoAnimalDesejado)} />
        <Row label="Pode arcar com custos veterinários" value={yn(adotante.podeArcarCustosVet)} />
        <Row label="É adoção para presentear" value={yn(adotante.adocaoParaPresente)} />
        {adotante.adocaoParaPresente && <Row label="Detalhe do presente" value={tx(adotante.adocaoParaPresenteDetalhe)} />}
      </Section>
      <Section title="Moradia">
        <Row label="Tipo de moradia" value={adotante.tipoMoradia ? tipoMoradiaLabel[adotante.tipoMoradia] : "—"} />
        <Row label="Moradia própria" value={yn(adotante.moradiaPropria)} />
        <Row label="Nº de adultos na casa" value={adotante.numAdultosCasa?.toString() ?? "—"} />
        <Row label="Há crianças" value={yn(adotante.temCriancas)} />
        {adotante.temCriancas && <Row label="Faixa etária das crianças" value={tx(adotante.criancasFaixaEtaria)} />}
        <Row label="Todos concordam com a adoção" value={yn(adotante.todosConcordamAdocao)} />
        <Row label="Condomínio permite animal" value={tx(adotante.condominioPermiteAnimal)} />
        <Row label="Janelas teladas / protegidas" value={yn(adotante.janelasTeladas)} />
        <Row label="Muros e portões seguros" value={yn(adotante.murosSeguros)} />
        <Row label="Acesso à rua" value={tx(adotante.acessoRua)} />
      </Section>
      <Section title="Rotina">
        <Row label="Horas sozinho por dia" value={tx(adotante.horasSozinho)} />
        <Row label="Responsável em caso de viagem" value={tx(adotante.responsavelViagem)} />
        <Row label="Plano em caso de gravidez" value={tx(adotante.planoEmGravidez)} />
        <Row label="Plano em caso de mudança" value={tx(adotante.planoMudanca)} />
        <Row label="Alguém alérgico na casa" value={yn(adotante.alergicosNaCasa)} />
        {adotante.alergicosNaCasa && <Row label="Detalhes alergias" value={tx(adotante.alergicosNaCasaDetalhe)} />}
      </Section>
      <Section title="Histórico">
        <Row label="Já teve animais antes" value={yn(adotante.teveAnimaisAntes)} />
        {adotante.teveAnimaisAntes && <Row label="Descrição de animais anteriores" value={tx(adotante.animaisAnterioresDescricao)} />}
        <Row label="Tem outros animais atualmente" value={yn(adotante.temOutrosAnimais)} />
        {adotante.temOutrosAnimais && <Row label="Descrição dos outros animais" value={tx(adotante.outrosAnimaisDescricao)} />}
        <Row label="Histórico de devolução" value={tx(adotante.historicoDevolucao)} />
        <Row label="Histórico de perda/descuido" value={tx(adotante.historicoPercaDescuido)} />
      </Section>
      <Section title="Compromissos">
        <Row label="Ciente da longevidade" value={yn(adotante.cienteLongevidade)} />
        <Row label="Permite visita do protetor" value={yn(adotante.permiteVisitaProtetor)} />
        <Row label="Ciente de que não pode repassar" value={yn(adotante.cienteNaoRepassar)} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h3 className="mb-2 font-medium">{title}</h3>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">{children}</dl>
    </section>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col py-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}
