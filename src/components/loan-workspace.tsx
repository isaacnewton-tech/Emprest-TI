"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/trpc/react";
import { Button } from "./ui/button";

export const categories = {
  notebook: "Notebook", monitor: "Monitor", cabo: "Cabo", camera: "Câmera",
} as const;
const situations = {
  disponivel: "Disponível", manutencao: "Em manutenção", emprestado: "Emprestado",
} as const;
const dueFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short",
});

export function formatDue(date: Date) { return dueFormatter.format(date); }

export function EquipmentStatus({ status }: { status: keyof typeof situations }) {
  return <span className={"loan-status " + status}>{situations[status]}</span>;
}

export function PhotoCredit() {
  return <a className="photo-credit" href="https://pixabay.com/" target="_blank" rel="noreferrer">Fotos: Pixabay</a>;
}

export function LoanWorkspace({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const cache = useQueryClient();
  const identity = api.auth.me.useQuery({});
  const finishLogout = () => { cache.clear(); router.replace("/login"); router.refresh(); };
  const logout = api.auth.logout.useMutation({
    onSuccess: finishLogout,
    onError(error) {
      if (error.data?.code === "UNAUTHORIZED" || error.data?.code === "SERVICE_UNAVAILABLE") finishLogout();
    },
  });
  useEffect(() => {
    if (identity.error?.data?.code === "UNAUTHORIZED") {
      cache.clear();
      router.replace("/login");
      router.refresh();
    }
  }, [identity.error, cache, router]);
  const inLoans = path === "/meus-emprestimos";
  return (
    <div className="loan-workspace">
      <aside className="loan-sidebar">
        <Link className="loan-brand" href="/catalogo" prefetch={false}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12 4 7.5m8 4.5v9m-4-15.75 8 4.5" />
          </svg>
          EmpresTI
        </Link>
        <nav aria-label="Área do colaborador">
          <Link href="/catalogo" prefetch={false} aria-current={!inLoans ? "page" : undefined}>Catálogo</Link>
          <Link href="/meus-emprestimos" prefetch={false} aria-current={inLoans ? "page" : undefined}>Meus empréstimos</Link>
        </nav>
        <div className="loan-account">
          {identity.data && <span>{identity.data.email}</span>}
          <Button disabled={logout.isPending} onClick={() => logout.mutate({})}>{logout.isPending ? "Saindo…" : "Sair"}</Button>
          {logout.error && <p role="alert">Não foi possível sair. Tente novamente.</p>}
        </div>
      </aside>
      <main className="loan-main">{children}</main>
    </div>
  );
}
