import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

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

