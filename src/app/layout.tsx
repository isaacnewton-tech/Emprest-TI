import type { Metadata } from "next";
import { TRPCProvider } from "@/trpc/react";

import "./globals.css";
import "./loans.css";

export const metadata: Metadata = {
  title: "EmpresTI",
  description: "Empréstimo interno de equipamentos de TI",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body><TRPCProvider>{children}</TRPCProvider></body>
    </html>
  );
}
