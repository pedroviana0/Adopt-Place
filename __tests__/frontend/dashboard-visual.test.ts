import { describe, expect, it } from "vitest";

import type { DashboardPriorityItem } from "../../frontend/src/lib/data/dashboard";
import {
  activityKindTone,
  buildIndicatorGroups,
  funnelRows,
  priorityKindMeta,
  resolveHref,
  requiresAction,
  statusSlices,
  visiblePriorities,
} from "../../frontend/src/lib/dashboard-visual";
import { acolhedor, organizacaoCheia } from "./dashboard-fixtures";

// Spec 011: view-model do painel (data-model.md, ui-contracts.md §2).

const items = (n: number): DashboardPriorityItem[] =>
  Array.from({ length: n }, (_, i) => ({
    id: String(i),
    kind: "SAUDE_ATRASADA",
    title: `Item ${i}`,
    subtitle: "Thor",
    href: `/x/${i}`,
  }));

describe("resolveHref (D8)", () => {
  it("normaliza a agenda de saúde, como antes", () => {
    expect(resolveHref("/dashboard/saude/agenda?situacao=ATRASADO")).toBe("/dashboard/saude?situacao=ATRASADO");
  });

  it("leva a saúde do animal ao detalhe, que tem a aba Saúde (rota /saude não existe)", () => {
    expect(resolveHref("/dashboard/animais/abc123/saude")).toBe("/dashboard/animais/abc123");
  });

  it("não mexe nos demais caminhos", () => {
    expect(resolveHref("/dashboard/animais?status=DISPONIVEL")).toBe("/dashboard/animais?status=DISPONIVEL");
    expect(resolveHref("/dashboard/solicitacoes/s1")).toBe("/dashboard/solicitacoes/s1");
  });
});

describe("visiblePriorities (US1, RF-PEN-01)", () => {
  it("mostra os 5 primeiros na ordem recebida e conta o resto", () => {
    const result = visiblePriorities(items(7), false);
    expect(result.visible.map((item) => item.id)).toEqual(["0", "1", "2", "3", "4"]);
    expect(result.hiddenCount).toBe(2);
  });

  it("expandido mostra todos", () => {
    const result = visiblePriorities(items(7), true);
    expect(result.visible).toHaveLength(7);
    expect(result.hiddenCount).toBe(0);
  });

  it("com 5 ou menos não esconde nada", () => {
    expect(visiblePriorities(items(5), false)).toMatchObject({ hiddenCount: 0 });
    expect(visiblePriorities(items(5), false).visible).toHaveLength(5);
    expect(visiblePriorities([], false)).toEqual({ visible: [], hiddenCount: 0 });
  });
});

describe("priorityKindMeta (US1, RF-PEN-03)", () => {
  it("dá tom e etiqueta escrita a cada tipo", () => {
    expect(priorityKindMeta).toEqual({
      SAUDE_ATRASADA: { tone: "destructive", label: "Atrasado" },
      SAUDE_HOJE: { tone: "warning", label: "Hoje" },
      SOLICITACAO_ANALISE: { tone: "primary", label: "Solicitação" },
      ADOCAO_APROVADA_CONCLUSAO: { tone: "success", label: "Concluir adoção" },
    });
  });
});

describe("requiresAction (US2, C4)", () => {
  it("só os três cards de pendência, só com número > 0", () => {
    expect(requiresAction("overdueHealthCare", 1)).toBe(true);
    expect(requiresAction("requestsWaitingReview", 3)).toBe(true);
    expect(requiresAction("animalsInFosterUnregistered", 2)).toBe(true);
    expect(requiresAction("overdueHealthCare", 0)).toBe(false);
    expect(requiresAction("animalsInFosterUnregistered", 0)).toBe(false);
    expect(requiresAction("next7DaysHealthCare", 9)).toBe(false);
    expect(requiresAction("animalsSeekingFoster", 9)).toBe(false);
    expect(requiresAction("availableAnimals", 9)).toBe(false);
  });
});

describe("buildIndicatorGroups (US2, C2, C3, D7, D8)", () => {
  it("organização: três grupos na ordem e com os tons da spec", () => {
    const groups = buildIndicatorGroups(organizacaoCheia.indicators);
    expect(groups.map((group) => [group.id, group.title, group.tone])).toEqual([
      ["adocao", "Adoção", "primary"],
      ["saude", "Saúde", "information"],
      ["lt", "Lar temporário", "brand"],
    ]);
    expect(groups.map((group) => group.cards.map((card) => [card.key, card.tone]))).toEqual([
      [
        ["availableAnimals", "primary"],
        ["animalsInCare", "neutral"],
        ["animalsInAdoptionProcess", "accent"],
        ["requestsWaitingReview", "primary"],
      ],
      [
        ["overdueHealthCare", "destructive"],
        ["next7DaysHealthCare", "warning"],
        ["animalsInTreatment", "information"],
      ],
      [
        ["animalsSeekingFoster", "warning"],
        ["animalsInFosterUnregistered", "success"],
      ],
    ]);
  });

  it("mantém os rótulos de hoje e passa o href por resolveHref", () => {
    const cards = buildIndicatorGroups(organizacaoCheia.indicators).flatMap((group) => group.cards);
    expect(cards.map((card) => card.label)).toEqual([
      "Disponíveis",
      "Em cuidados",
      "Em processo de adoção",
      "Solicitações aguardando análise",
      "Cuidados atrasados",
      "Cuidados nos próximos 7 dias",
      "Em tratamento",
      "Procurando LT",
      "Em LT sem registro",
    ]);
    const overdue = cards.find((card) => card.key === "overdueHealthCare");
    expect(overdue).toMatchObject({ href: "/dashboard/saude?situacao=ATRASADO", count: 2, requiresAction: true });
  });

  it("acolhedor: sem o grupo de LT", () => {
    const groups = buildIndicatorGroups(acolhedor.indicators);
    expect(groups.map((group) => group.id)).toEqual(["adocao", "saude"]);
  });

  it("grupo de LT com só um dos opcionais traz só esse card", () => {
    const { animalsInFosterUnregistered: _omit, ...indicators } = organizacaoCheia.indicators;
    const lt = buildIndicatorGroups(indicators).find((group) => group.id === "lt");
    expect(lt?.cards.map((card) => card.key)).toEqual(["animalsSeekingFoster"]);
  });
});

describe("statusSlices (US3, C6)", () => {
  it("ordem do ciclo, frações, porcentagens e links", () => {
    const slices = statusSlices({ EM_CUIDADOS: 3, DISPONIVEL: 5, EM_PROCESSO_ADOCAO: 1, ADOTADO: 1 });
    expect(slices.map((slice) => [slice.status, slice.label, slice.count, slice.fraction, slice.percent])).toEqual([
      ["EM_CUIDADOS", "Em cuidados", 3, 0.3, 30],
      ["DISPONIVEL", "Disponível", 5, 0.5, 50],
      ["EM_PROCESSO_ADOCAO", "Em processo de adoção", 1, 0.1, 10],
      ["ADOTADO", "Adotado", 1, 0.1, 10],
    ]);
    expect(slices[2].href).toBe("/dashboard/animais?status=EM_PROCESSO_ADOCAO");
  });

  it("total 0 não divide por zero", () => {
    const slices = statusSlices({ EM_CUIDADOS: 0, DISPONIVEL: 0, EM_PROCESSO_ADOCAO: 0, ADOTADO: 0 });
    expect(slices.map((slice) => [slice.fraction, slice.percent])).toEqual([
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ]);
  });
});

describe("funnelRows (US4, C7)", () => {
  const widths = (a: number, b: number, c: number) =>
    funnelRows({ inAnalysis: a, approvedOrInProcess: b, completedInPeriod: c }).map((row) => row.widthPercent);

  it("rótulos e tons", () => {
    expect(
      funnelRows({ inAnalysis: 3, approvedOrInProcess: 2, completedInPeriod: 1 }).map((row) => [row.key, row.label, row.value, row.tone]),
    ).toEqual([
      ["inAnalysis", "Em análise", 3, "primary"],
      ["approvedOrInProcess", "Aprovadas / em processo", 2, "primary"],
      ["completedInPeriod", "Concluídas no período", 1, "success"],
    ]);
  });

  it("escala relativa ao maior valor", () => {
    const [a, b, c] = widths(3, 2, 1);
    expect(a).toBe(100);
    expect(b).toBeCloseTo(66.667, 2);
    expect(c).toBeCloseTo(33.333, 2);
  });

  it("o maior não precisa ser o primeiro (contagens independentes)", () => {
    expect(widths(1, 5, 2)).toEqual([20, 100, 40]);
  });

  it("valor > 0 tem no mínimo 4%; zero fica zero", () => {
    expect(widths(50, 1, 0)).toEqual([100, 4, 0]);
  });

  it("tudo zero não divide por zero", () => {
    expect(widths(0, 0, 0)).toEqual([0, 0, 0]);
  });
});

describe("activityKindTone (US5, RF-ATV-02)", () => {
  it("dá um tom a cada tipo de atividade", () => {
    expect(activityKindTone).toEqual({
      ANIMAL_CADASTRADO: "primary",
      SAUDE_REGISTRADA: "information",
      SOLICITACAO_RECEBIDA: "neutral",
      SOLICITACAO_APROVADA: "primary",
      ADOCAO_CONCLUIDA: "success",
    });
  });
});
