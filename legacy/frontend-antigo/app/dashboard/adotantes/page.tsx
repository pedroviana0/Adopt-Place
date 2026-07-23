import { redirect } from "next/navigation";

import { CompletedAdoptionList } from "@/components/app/solicitacoes/completed-adoption-list";
import { getServerSession } from "@/lib/auth";
import { getCompletedAdoptions } from "@/lib/queries/completed-adoptions";

export default async function AdotantesPage() {
  const session = await getServerSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const tipoPerfil = session.user.tipoPerfil;

  if (tipoPerfil !== "ORGANIZACAO" && tipoPerfil !== "ACOLHEDOR") {
    redirect("/login");
  }

  const responsavelId =
    tipoPerfil === "ORGANIZACAO"
      ? session.user.organizacaoId
      : session.user.acolhedorId;

  if (!responsavelId) {
    redirect("/login");
  }

  const adoptions = await getCompletedAdoptions(responsavelId, tipoPerfil);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Adotantes</h1>
      <CompletedAdoptionList adoptions={adoptions} />
    </div>
  );
}
