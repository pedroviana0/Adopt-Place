"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui";

export function DashboardErrorState() {
  return <section className="border-y py-12 text-center"><h2 className="text-lg font-semibold">Nao foi possivel carregar o painel</h2><p className="mt-2 text-sm text-[var(--muted-foreground)]">Tente novamente para buscar os dados operacionais atualizados.</p><Button className="mt-5" onClick={() => window.location.reload()}><RefreshCw className="mr-2 size-4" />Tentar novamente</Button></section>;
}
