"use client";

import { useState, useTransition } from "react";

import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { setUserActive } from "@/lib/actions/admin-users";
import type { User } from "@/lib/queries/admin-users";
import { TipoPerfil } from "@prisma/client";

type AdminUsersTableProps = {
  users: User[];
};

const perfilLabel: Record<TipoPerfil, string> = {
  ADOTANTE: "Adotante",
  ORGANIZACAO: "Organização",
  ACOLHEDOR: "Acolhedor",
  ADMIN: "Admin",
};

export function AdminUsersTable({ users }: AdminUsersTableProps) {
  const [optimisticStates, setOptimisticStates] = useState<Record<string, boolean>>(
    () => Object.fromEntries(users.map((u) => [u.id, u.ativo]))
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const handleToggle = (userId: string, currentAtivo: boolean) => {
    setErrors((prev) => ({ ...prev, [userId]: "" }));
    setOptimisticStates((prev) => ({ ...prev, [userId]: !currentAtivo }));

    startTransition(async () => {
      const result = await setUserActive({ userId, ativo: !currentAtivo });
      if (result.error) {
        setErrors((prev) => ({ ...prev, [userId]: result.error! }));
        setOptimisticStates((prev) => ({ ...prev, [userId]: currentAtivo }));
      }
    });
  };

  if (users.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        Nenhum usuário cadastrado.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant="outline">{perfilLabel[user.tipoPerfil]}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={optimisticStates[user.id] ? "default" : "destructive"}>
                  {optimisticStates[user.id] ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant={optimisticStates[user.id] ? "destructive" : "default"}
                  disabled={isPending}
                  onClick={() => handleToggle(user.id, optimisticStates[user.id])}
                >
                  {optimisticStates[user.id] ? "Desativar" : "Reativar"}
                </Button>
                {errors[user.id] && (
                  <span className="ml-2 text-xs text-[var(--destructive)]">{errors[user.id]}</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
