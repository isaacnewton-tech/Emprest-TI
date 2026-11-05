"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";

export function AuthenticatedArea() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const identity = api.auth.me.useQuery({});
  const finishLogout = () => { queryClient.clear(); router.replace("/login"); router.refresh(); };
  const logout = api.auth.logout.useMutation({
    onSuccess: finishLogout,
    onError(error) {
      if (error.data?.code === "UNAUTHORIZED" || error.data?.code === "SERVICE_UNAVAILABLE") finishLogout();
    },
  });
  useEffect(() => {
    if (identity.error?.data?.code === "UNAUTHORIZED") { router.replace("/login"); router.refresh(); }
  }, [identity.error, router]);

  return (
    <main className="session-page">
      <section className="session-panel" aria-label="Sua conta">
        <p className="brand">EmpresTI</p>
        {identity.isPending ? <p role="status">Verificando sua sessão…</p> : identity.error ? (
          <div role="alert"><h1 id="session-title">Não foi possível verificar sua sessão.</h1><p>Tente novamente ou entre na sua conta.</p><a href="/login">Voltar ao login</a></div>
        ) : (
          <>
            <h1 id="session-title">Você está conectado.</h1>
            <p className="session-email">{identity.data.email}</p>
            <p>O catálogo ainda está em preparação.</p>
            <Button disabled={logout.isPending} onClick={() => logout.mutate({})}>{logout.isPending ? "Saindo…" : "Sair"}</Button>
            {logout.error && <p role="alert">Não foi possível sair. Tente novamente.</p>}
          </>
        )}
      </section>
    </main>
  );
}
