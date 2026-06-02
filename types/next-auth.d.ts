import type { TipoPerfil } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tipoPerfil: TipoPerfil;
      ativo: boolean;
      adotanteId: string | null;
      organizacaoId: string | null;
      acolhedorId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    tipoPerfil: TipoPerfil;
    ativo: boolean;
    adotanteId: string | null;
    organizacaoId: string | null;
    acolhedorId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tipoPerfil: TipoPerfil;
    ativo: boolean;
    adotanteId: string | null;
    organizacaoId: string | null;
    acolhedorId: string | null;
  }
}
