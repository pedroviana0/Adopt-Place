"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge, Button, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import type { OwnerRequest } from "@/lib/queries/owner-requests";
import { StatusSolicitacao } from "@prisma/client";

type RequestListProps = {
  requests: OwnerRequest[];
  activeStatus?: StatusSolicitacao;
};

const statusOptions: StatusSolicitacao[] = ["EM_ANALISE", "APROVADA", "RECUSADA", "CONCLUIDA"];

const statusLabel: Record<StatusSolicitacao, string> = {
  EM_ANALISE: "Em analise",
  APROVADA: "Aprovada",
  RECUSADA: "Recusada",
  CONCLUIDA: "Concluida",
};

const statusVariant: Record<StatusSolicitacao, "default" | "secondary" | "outline" | "destructive"> = {
  EM_ANALISE: "default",
  APROVADA: "outline",
  RECUSADA: "destructive",
  CONCLUIDA: "secondary",
};

export function RequestList({ requests, activeStatus }: RequestListProps) {
  const router = useRouter();

  if (requests.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        Nenhuma solicitacao recebida ainda.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <label htmlFor="status-filter" className="mb-1 block text-sm font-medium">
          Filtrar por status
        </label>
        <Select
          id="status-filter"
          value={activeStatus ?? "ALL"}
          onChange={(event) => {
            const status = event.target.value;
            router.push(
              status === "ALL"
                ? "/dashboard/solicitacoes"
                : `/dashboard/solicitacoes?status=${status}`,
            );
          }}
        >
          <option value="ALL">Todas</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {statusLabel[status]}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table aria-label="Lista de solicitacoes de adocao">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Animal</TableHead>
              <TableHead scope="col">Adotante</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col">Data</TableHead>
              <TableHead scope="col">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.animal.nome}</TableCell>
                <TableCell>{request.adotante.nomeCompleto}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[request.status]}>
                    {statusLabel[request.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(request.dataSolicitacao).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/solicitacoes/${request.id}`}>
                    <Button variant="ghost" aria-label={`Ver detalhes da solicitacao de ${request.animal.nome}`}>
                      Ver detalhes
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
