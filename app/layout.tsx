import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AdoptPlace",
    template: "%s | AdoptPlace",
  },
  description: "Plataforma para gestao de resgate, cuidado e adocao responsavel de animais.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
