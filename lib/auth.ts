import NextAuth from "next-auth";
import type { Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { TipoPerfil } from "@prisma/client";
import { compare } from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1),
});

const nullableStringSchema = z.string().nullable();
const tokenSessionSchema = z.object({
  tipoPerfil: z.nativeEnum(TipoPerfil),
  ativo: z.boolean(),
  adotanteId: nullableStringSchema,
  organizacaoId: nullableStringSchema,
  acolhedorId: nullableStringSchema,
});

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        const usuario = await prisma.usuario.findUnique({
          where: { email: parsed.data.email },
          include: {
            adotante: { select: { id: true } },
            organizacao: { select: { id: true } },
            acolhedor: { select: { id: true } },
          },
        });

        if (!usuario?.ativo) {
          return null;
        }

        const passwordMatches = await compare(parsed.data.password, usuario.senhaHash);

        if (!passwordMatches) {
          return null;
        }

        return {
          id: usuario.id,
          email: usuario.email,
          tipoPerfil: usuario.tipoPerfil,
          ativo: usuario.ativo,
          adotanteId: usuario.adotante?.id ?? null,
          organizacaoId: usuario.organizacao?.id ?? null,
          acolhedorId: usuario.acolhedor?.id ?? null,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.tipoPerfil = user.tipoPerfil;
        token.ativo = user.ativo;
        token.adotanteId = user.adotanteId;
        token.organizacaoId = user.organizacaoId;
        token.acolhedorId = user.acolhedorId;
      }

      return token;
    },
    session({ session, token }) {
      const enrichedToken = tokenSessionSchema.safeParse(token);

      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.tipoPerfil = enrichedToken.success ? enrichedToken.data.tipoPerfil : "ADOTANTE";
        session.user.ativo = enrichedToken.success ? enrichedToken.data.ativo : false;
        session.user.adotanteId = enrichedToken.success ? enrichedToken.data.adotanteId : null;
        session.user.organizacaoId = enrichedToken.success ? enrichedToken.data.organizacaoId : null;
        session.user.acolhedorId = enrichedToken.success ? enrichedToken.data.acolhedorId : null;
      }

      return session;
    },
  },
});

export async function getServerSession(): Promise<Session | null> {
  return auth();
}
