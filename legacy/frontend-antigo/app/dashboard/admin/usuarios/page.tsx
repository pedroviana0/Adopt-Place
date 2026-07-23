import { redirect } from "next/navigation";

import { AdminUsersTable } from "@/components/app/dashboard/admin-users-table";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/actions/auth-guards";
import { getAllUsers } from "@/lib/queries/admin-users";

export default async function AdminUsuariosPage() {
  const session = await requireAdmin();

  if (session.user.tipoPerfil !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Gerenciar Usuarios</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Ative ou desative contas de usuarios.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Usuarios</h2>
        </CardHeader>
        <CardContent>
          <AdminUsersTable users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
