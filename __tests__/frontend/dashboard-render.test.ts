// React do próprio frontend: a PriorityList usa useState, e o hook só funciona
// se o renderizador e o componente usarem a mesma cópia do React. Os imports
// "react" da raiz trariam a cópia de node_modules/ da raiz (erro "reading
// 'useState'" de null).
import { createElement } from "../../frontend/node_modules/react";
import { renderToStaticMarkup } from "../../frontend/node_modules/react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardSkeleton } from "../../frontend/src/components/app/dashboard/DashboardSkeleton";
import { OperationalDashboard } from "../../frontend/src/components/app/dashboard/OperationalDashboard";
import type { OperationalDashboard as Data } from "../../frontend/src/lib/data/dashboard";
import { resolveHref } from "../../frontend/src/lib/dashboard-visual";
import { acolhedor, organizacaoCheia, vazio } from "./dashboard-fixtures";

// Spec 011 (C11): render estático do painel. O componente recebe os dados por
// prop; sessão, query, carregando e erro ficam na rota.

const render = (data: Data) => renderToStaticMarkup(createElement(OperationalDashboard, { data }));
const count = (html: string, text: string) => html.split(text).length - 1;
// Texto visível, sem tags, para buscas que não devem casar com atributos.
const textOf = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

describe("painel: não regressão", () => {
  it("mantém os href dos indicadores, passando por resolveHref (D8)", () => {
    const html = render(organizacaoCheia);
    for (const indicator of Object.values(organizacaoCheia.indicators)) {
      expect(html).toContain(`href="${resolveHref(indicator.href).replace(/&/g, "&amp;")}"`);
    }
    expect(html).toContain('href="/dashboard/saude?situacao=ATRASADO"');
    expect(html).not.toContain("/dashboard/saude/agenda");
  });

  it("não tem cor hardcoded no HTML (SC-03)", () => {
    for (const data of [organizacaoCheia, acolhedor, vazio]) {
      const html = render(data);
      expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
      expect(html).not.toContain("rgb(");
    }
  });
});

describe("pendências (US1)", () => {
  it("vem antes dos indicadores, mostra 5 itens e o botão de expandir", () => {
    const html = render(organizacaoCheia);
    expect(html.indexOf("O que precisa de atenção")).toBeGreaterThan(-1);
    expect(html.indexOf("O que precisa de atenção")).toBeLessThan(html.indexOf("Disponíveis"));
    expect(count(html, 'data-priority-item=""')).toBe(5);
    expect(textOf(html)).toContain("Mostrar todas (7)");
    for (const label of ["Atrasado", "Hoje", "Solicitação"]) expect(textOf(html)).toContain(label);
  });

  it("expõe a etiqueta de conclusão quando o item aparece", () => {
    const html = render({ ...organizacaoCheia, priorityItems: organizacaoCheia.priorityItems.slice(3) });
    expect(textOf(html)).toContain("Concluir adoção");
    expect(textOf(html)).not.toContain("Mostrar todas");
  });

  it("vazio: frase sem emoji", () => {
    const html = render(vazio);
    expect(textOf(html)).toContain("Nada pendente no momento.");
    expect(html).not.toContain("🎉");
  });
});

describe("indicadores (US2)", () => {
  it("organização: três grupos, ajuda de Em cuidados e Requer ação em 3 cards", () => {
    const text = textOf(render(organizacaoCheia));
    for (const title of ["Adoção", "Saúde", "Lar temporário"]) expect(text).toContain(title);
    expect(text).toContain("Em cuidados = ainda não anunciado");
    expect(count(text, "Requer ação")).toBe(3);
  });

  it("acolhedor: nenhum texto de LT", () => {
    const text = textOf(render(acolhedor));
    expect(text).not.toContain("Lar temporário");
    expect(text).not.toContain("Procurando LT");
    expect(text).not.toContain("Em LT");
  });

  it("vazio: nenhum Requer ação", () => {
    expect(textOf(render(vazio))).not.toContain("Requer ação");
  });
});

describe("status (US3)", () => {
  it("legenda com os 4 links e porcentagem; sem a grade de 5 colunas", () => {
    const html = render(organizacaoCheia);
    for (const status of ["EM_CUIDADOS", "DISPONIVEL", "EM_PROCESSO_ADOCAO", "ADOTADO"]) {
      expect(html).toContain(`href="/dashboard/animais?status=${status}"`);
    }
    expect(textOf(html)).toContain("Disponível · 12 (60%)");
    expect(html).not.toContain("sm:grid-cols-5");
  });

  it("vazio: texto de nenhum animal", () => {
    expect(textOf(render(vazio))).toContain("Nenhum animal cadastrado ainda.");
  });
});

describe("funil (US4)", () => {
  it("rótulos e números escritos", () => {
    const text = textOf(render(organizacaoCheia));
    expect(text).toContain("Funil de adoção (30 dias)");
    for (const label of ["Em análise", "Aprovadas / em processo", "Concluídas no período"]) {
      expect(text).toContain(label);
    }
  });

  it("tudo zero: texto de nenhuma solicitação", () => {
    expect(textOf(render(vazio))).toContain("Nenhuma solicitação nos últimos 30 dias.");
  });
});

describe("atividade (US5)", () => {
  it("links só nos itens com href", () => {
    const html = render(organizacaoCheia);
    expect(textOf(html)).toContain("Atividade recente");
    for (const activity of organizacaoCheia.recentActivity) {
      expect(textOf(html)).toContain(activity.label);
      if (activity.href) expect(html).toContain(`href="${resolveHref(activity.href)}"`);
    }
    expect(count(html, 'data-activity-link=""')).toBe(4);
    expect(html).not.toContain("/saude\"");
  });

  it("vazio: seção some", () => {
    expect(textOf(render(vazio))).not.toContain("Atividade recente");
  });
});

describe("esqueleto (US6)", () => {
  it("anuncia o carregamento e tem 2 blocos de grupo", () => {
    const html = renderToStaticMarkup(createElement(DashboardSkeleton));
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Carregando painel…");
    expect(count(html, 'data-skeleton="grupo"')).toBe(2);
  });
});

