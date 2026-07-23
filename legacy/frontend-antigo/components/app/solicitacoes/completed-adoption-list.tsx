import Link from "next/link";

import { Card, CardContent } from "@/components/ui";
import type { CompletedAdoption } from "@/lib/queries/completed-adoptions";

type CompletedAdoptionListProps = {
  adoptions: CompletedAdoption[];
};

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function CompletedAdoptionList({ adoptions }: CompletedAdoptionListProps) {
  if (adoptions.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        Nenhuma adoção concluída ainda.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {adoptions.map((adoption) => (
        <li key={adoption.id}>
          <Link href={`/dashboard/adotantes/${adoption.adotante.id}`}>
            <Card className="transition-colors hover:bg-[var(--muted)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{adoption.animal.nome}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {adoption.adotante.nomeCompleto}
                    </p>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {formatDate(adoption.dataAtualizacao)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
