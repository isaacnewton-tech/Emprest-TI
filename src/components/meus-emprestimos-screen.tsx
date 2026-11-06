"use client";

import Link from "next/link";
import { api } from "@/trpc/react";
import { Button } from "./ui/button";
import { categories, formatDue, LoanWorkspace } from "./loan-workspace";

export function MyLoansScreen() {
  const loans = api.emprestimos.meusAbertos.useQuery({});
  return (
    <LoanWorkspace>
      <header className="loan-header">
        <h1>Meus empréstimos</h1>
        {loans.data && <p>{loans.data.itens.length} de {loans.data.limite} empréstimos em aberto</p>}
      </header>
      {loans.isPending ? <p className="loan-feedback" role="status">Carregando seus empréstimos…</p> :
        loans.error ? <div className="loan-feedback" role="alert"><p>{loans.error.message}</p><Button onClick={() => void loans.refetch()}>Tentar novamente</Button></div> :
        !loans.data.itens.length ? <div className="loan-feedback"><p>Você não tem empréstimos em aberto.</p><Link href="/catalogo" prefetch={false}>Ver catálogo</Link></div> :
          <ul className="my-loans-list" aria-label="Empréstimos em aberto">
            {loans.data.itens.map((loan) => (
              <li key={loan.id} className={loan.emAtraso ? "overdue" : undefined}>
                <div><h2>{loan.equipment.nome}</h2><p>{categories[loan.equipment.categoria]} · {loan.equipment.patrimonio}</p></div>
                <div className="loan-due">
                  <span>Devolver até</span>
                  <time dateTime={loan.dueAt.toISOString()}>{formatDue(loan.dueAt)}</time>
                  <span className={"loan-status " + (loan.emAtraso ? "overdue" : "disponivel")}>{loan.emAtraso ? "Em atraso" : "No prazo"}</span>
                </div>
              </li>
            ))}
          </ul>
      }
    </LoanWorkspace>
  );
}
