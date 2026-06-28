"use client";

import { Card, CardContent, CardHeader } from "@/components/ui";
import type { OwnerRequestDetail } from "@/lib/queries/owner-request-detail";

type ScreeningReviewProps = {
  adotante: OwnerRequestDetail["adotante"];
};

function formatBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "Nao informado";
  return value ? "Sim" : "Nao";
}

function formatString(value: string | null | undefined): string {
  return value ?? "Nao informado";
}

export function ScreeningReview({ adotante }: ScreeningReviewProps) {
  return (
    <div className="space-y-4">
      <Card aria-labelledby="screening-identification-heading">
        <CardHeader>
          <h3 id="screening-identification-heading" className="text-base font-semibold">Identificacao</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="font-medium">Nome:</span> {formatString(adotante.nomeCompleto)}</p>
          <p><span className="font-medium">CPF:</span> {formatString(adotante.cpf)}</p>
          <p><span className="font-medium">Telefone:</span> {formatString(adotante.telefone)}</p>
          <p><span className="font-medium">Instagram:</span> {formatString(adotante.instagram)}</p>
          <p><span className="font-medium">Endereco:</span> {formatString(adotante.endereco)}</p>
          <p><span className="font-medium">Cidade:</span> {formatString(adotante.cidade)}</p>
          <p><span className="font-medium">Estado:</span> {formatString(adotante.estado)}</p>
        </CardContent>
      </Card>

      <Card aria-labelledby="screening-adoption-heading">
        <CardHeader>
          <h3 id="screening-adoption-heading" className="text-base font-semibold">Sobre a adocao</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="font-medium">Motivo da adocao:</span> {formatString(adotante.motivoAdocao)}</p>
          <p><span className="font-medium">Tipo de animal desejado:</span> {formatString(adotante.tipoAnimalDesejado)}</p>
          <p><span className="font-medium">Pode arcar custos veterinarios:</span> {formatBoolean(adotante.podeArcarCustosVet)}</p>
          <p><span className="font-medium">Adocao para presente:</span> {formatBoolean(adotante.adocaoParaPresente)}</p>
        </CardContent>
      </Card>

      <Card aria-labelledby="screening-housing-heading">
        <CardHeader>
          <h3 id="screening-housing-heading" className="text-base font-semibold">Moradia</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="font-medium">Tipo de moradia:</span> {formatString(adotante.tipoMoradia)}</p>
          <p><span className="font-medium">Moradia propria:</span> {formatBoolean(adotante.moradiaPropria)}</p>
          <p><span className="font-medium">Numero de adultos na casa:</span> {formatString(adotante.numAdultosCasa?.toString())}</p>
          <p><span className="font-medium">Tem criancas:</span> {formatBoolean(adotante.temCriancas)}</p>
          <p><span className="font-medium">Faixa etaria das criancas:</span> {formatString(adotante.criancasFaixaEtaria)}</p>
          <p><span className="font-medium">Todos concordam com a adocao:</span> {formatBoolean(adotante.todosConordamAdocao)}</p>
          <p><span className="font-medium">Condominio permite animal:</span> {formatString(adotante.condominioPermiteAnimal)}</p>
          <p><span className="font-medium">Janelas teladas:</span> {formatBoolean(adotante.janelasTeladas)}</p>
          <p><span className="font-medium">Acesso a rua:</span> {formatString(adotante.acessoRua)}</p>
          <p><span className="font-medium">Muros seguros:</span> {formatBoolean(adotante.murosSeguros)}</p>
        </CardContent>
      </Card>

      <Card aria-labelledby="screening-routine-heading">
        <CardHeader>
          <h3 id="screening-routine-heading" className="text-base font-semibold">Rotina</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="font-medium">Horas sozinho:</span> {formatString(adotante.horasSozinho)}</p>
          <p><span className="font-medium">Responsavel pela viagem:</span> {formatString(adotante.responsavelViagem)}</p>
          <p><span className="font-medium">Plano em gravidez:</span> {formatString(adotante.planoEmGravidez)}</p>
          <p><span className="font-medium">Alergicos na casa:</span> {formatBoolean(adotante.alergicosNaCasa)}</p>
          <p><span className="font-medium">Plano mudanca:</span> {formatString(adotante.planoMudanca)}</p>
        </CardContent>
      </Card>

      <Card aria-labelledby="screening-history-heading">
        <CardHeader>
          <h3 id="screening-history-heading" className="text-base font-semibold">Historico</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="font-medium">Historico de devolucao:</span> {formatString(adotante.historicoDevolucao)}</p>
          <p><span className="font-medium">Historico de perda/descuido:</span> {formatString(adotante.historicoPercaDescuido)}</p>
          <p><span className="font-medium">Teve animais antes:</span> {formatBoolean(adotante.teveAnimaisAntes)}</p>
          <p><span className="font-medium">Animais anteriores descricao:</span> {formatString(adotante.animaisAnterioresDescricao)}</p>
          <p><span className="font-medium">Tem outros animais:</span> {formatBoolean(adotante.temOutrosAnimais)}</p>
          <p><span className="font-medium">Outros animais descricao:</span> {formatString(adotante.outrosAnimaisDescricao)}</p>
        </CardContent>
      </Card>

      <Card aria-labelledby="screening-commitments-heading">
        <CardHeader>
          <h3 id="screening-commitments-heading" className="text-base font-semibold">Compromissos</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="font-medium">Ciente da longevidade:</span> {formatBoolean(adotante.cienteLongevidade)}</p>
          <p><span className="font-medium">Permite visita ao protetor:</span> {formatBoolean(adotante.permiteVisitaProtetor)}</p>
          <p><span className="font-medium">Ciente de nao repassar:</span> {formatBoolean(adotante.ciendeNaoRepassar)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
