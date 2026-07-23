"use client";

import { useState, useTransition } from "react";

import { Badge, Button, FormItem, FormLabel, Textarea } from "@/components/ui";
import { decideAdoptionRequest } from "@/lib/actions/solicitacoes";

type RequestDecisionFormProps = {
  solicitacaoId: string;
  onDecision: () => void;
};

export function RequestDecisionForm({ solicitacaoId, onDecision }: RequestDecisionFormProps) {
  const [observacoes, setObservacoes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDecision = (decision: "APROVADA" | "RECUSADA") => {
    setError(null);
    startTransition(async () => {
      const result = await decideAdoptionRequest(solicitacaoId, { decision, observacoes });
      if (result.error) {
        setError(result.error);
      } else {
        onDecision();
      }
    });
  };

  return (
    <form className="space-y-4">
      <FormItem>
        <FormLabel>Observações</FormLabel>
        <Textarea
          placeholder="Adicione observações sobre a decisão..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          maxLength={1000}
          rows={4}
          disabled={isPending}
        />
        <p className="text-xs text-[var(--muted-foreground)]">
          {observacoes.length}/1000 caracteres
        </p>
      </FormItem>

      {error && (
        <Badge variant="destructive" className="w-fit">
          {error}
        </Badge>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="default"
          disabled={isPending}
          onClick={() => handleDecision("APROVADA")}
        >
          {isPending ? "Processando..." : "Aprovar"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={isPending}
          onClick={() => handleDecision("RECUSADA")}
        >
          {isPending ? "Processando..." : "Recusar"}
        </Button>
      </div>
    </form>
  );
}
