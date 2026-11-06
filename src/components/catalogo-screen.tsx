"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { MAX_OPEN_LOANS } from "@/shared/loans";
import { api, type RouterInputs, type RouterOutputs } from "@/trpc/react";
import { Button } from "./ui/button";
import { categories, EquipmentStatus, formatDue, LoanWorkspace, PhotoCredit } from "./loan-workspace";

type Item = RouterOutputs["catalogo"]["listar"]["itens"][number];
type Category = NonNullable<RouterInputs["catalogo"]["listar"]["categoria"]>;
const filters = Object.entries(categories) as [Category, string][];
const itemHref = (patrimonio: string) => "/catalogo/" + encodeURIComponent(patrimonio);

function EquipmentPhoto({ item, priority = false }: { item: Item; priority?: boolean }) {
  return <Image className="equipment-photo" src={item.photoUrl} alt={item.nome} width={800} height={600}
    unoptimized loading={priority ? "eager" : "lazy"} />;
}

export function CatalogScreen() {
  const [categoria, setCategory] = useState<Category>();
  const [disponiveis, setAvailable] = useState(false);
  const catalog = api.catalogo.listar.useInfiniteQuery({ categoria, disponiveis }, {
    getNextPageParam: (last) => last.nextCursor,
  });
  const items = catalog.data?.pages.flatMap((page) => page.itens) ?? [];
  return (
    <LoanWorkspace>
      <header className="loan-header">
        <h1>Catálogo</h1>
        {catalog.data && <p>{items.length} equipamentos exibidos · {items.filter((item) => item.situacao === "disponivel").length} disponíveis</p>}
      </header>
      <p className="loan-notice">Você pode ter até {MAX_OPEN_LOANS} empréstimos em aberto, com prazo de 14 dias úteis. Um atraso impede novas solicitações.</p>
      <div className="loan-filters">
        <div className="loan-chips" role="group" aria-label="Filtrar por categoria">
          <button type="button" aria-pressed={!categoria} onClick={() => setCategory(undefined)}>Todos</button>
          {filters.map(([value, name]) => <button type="button" key={value} aria-pressed={categoria === value} onClick={() => setCategory(value)}>{name}</button>)}
        </div>
        <label className="loan-checkbox"><input type="checkbox" checked={disponiveis} onChange={(event) => setAvailable(event.target.checked)} /> Só disponíveis</label>
      </div>
      {catalog.isPending ? <p className="loan-feedback" role="status">Carregando equipamentos…</p> :
        catalog.error ? <div className="loan-feedback" role="alert"><p>{catalog.error.message}</p><Button onClick={() => void catalog.refetch()}>Tentar novamente</Button></div> :
        !items.length ? <p className="loan-feedback" role="status">Nenhum equipamento corresponde aos filtros.</p> : (
          <>
            <div className="loan-photo-caption"><PhotoCredit /></div>
            <ul className="equipment-grid" aria-label="Equipamentos">
              {items.map((item) => (
                <li className="equipment-card" key={item.patrimonio}>
                  <EquipmentPhoto item={item} />
                  <div className="equipment-card-meta"><span>{categories[item.categoria]} · {item.patrimonio}</span><EquipmentStatus status={item.situacao} /></div>
                  <h2>{item.nome}</h2>
                  {item.situacao === "disponivel" && <Link href={itemHref(item.patrimonio)} prefetch={false} aria-label={"Ver detalhes de " + item.patrimonio}>Ver detalhes <span aria-hidden="true">→</span></Link>}
                </li>
              ))}
            </ul>
            {catalog.hasNextPage && <Button disabled={catalog.isFetchingNextPage} onClick={() => void catalog.fetchNextPage()}>{catalog.isFetchingNextPage ? "Carregando…" : "Ver mais equipamentos"}</Button>}
          </>
        )}
    </LoanWorkspace>
  );
}

export function EquipmentScreen({ patrimonio }: { patrimonio: string }) {
  const router = useRouter();
  const utils = api.useUtils();
  const detail = api.catalogo.detalhe.useQuery({ patrimonio });
  const loans = api.emprestimos.meusAbertos.useQuery({});
  const dialog = useRef<HTMLDialogElement>(null);
  const sending = useRef(false);
  const borrow = api.emprestimos.solicitar.useMutation({
    async onSuccess() {
      await Promise.all([utils.catalogo.invalidate(), utils.emprestimos.meusAbertos.invalidate()]);
      dialog.current?.close();
      router.push("/meus-emprestimos");
    },
    async onError() {
      await Promise.all([utils.catalogo.invalidate(), utils.emprestimos.meusAbertos.invalidate()]);
    },
    onSettled() { sending.current = false; },
  });
  const item = detail.data;
  const blocked = loans.data?.itens.some((loan) => loan.emAtraso)
    ? "Você tem um empréstimo em atraso."
    : (loans.data?.itens.length ?? 0) >= MAX_OPEN_LOANS
      ? "Você atingiu o limite de 5 empréstimos em aberto."
      : null;
  function submit() {
    if (sending.current || blocked || item?.situacao !== "disponivel") return;
    sending.current = true;
    borrow.mutate({ patrimonio });
  }
  return (
    <LoanWorkspace>
      <Link className="loan-back" href="/catalogo" prefetch={false}>← Voltar ao catálogo</Link>
      {detail.isPending ? <p className="loan-feedback" role="status">Carregando equipamento…</p> :
        detail.error ? <div className="loan-feedback" role="alert"><p>{detail.error.message}</p><Button onClick={() => void detail.refetch()}>Tentar novamente</Button></div> :
        item && (
          <>
            <header className="loan-header"><h1>{item.nome}</h1><p>{categories[item.categoria]} · {item.patrimonio}</p></header>
            <div className="equipment-detail">
              <section className="equipment-figure">
                <EquipmentPhoto item={item} priority />
                <div className="equipment-card-meta"><EquipmentStatus status={item.situacao} /><PhotoCredit /></div>
              </section>
              <section className="loan-box" aria-labelledby="solicitar-titulo">
                <h2 id="solicitar-titulo">Solicitar empréstimo</h2>
                {item.devolucaoPrevista && <dl><dt>Previsão de devolução</dt><dd>{formatDue(item.devolucaoPrevista)}</dd></dl>}
                {item.situacao !== "disponivel" ? <p>Este equipamento está indisponível.</p> :
                  loans.isPending ? <p role="status">Conferindo seus empréstimos…</p> :
                  loans.error ? <div role="alert"><p>{loans.error.message}</p><Button onClick={() => void loans.refetch()}>Tentar novamente</Button></div> :
                  <>
                    <p>{loans.data?.itens.length} de {MAX_OPEN_LOANS} empréstimos em aberto</p>
                    {blocked && <p className="loan-blocked" role="status">{blocked}</p>}
                    <Button disabled={Boolean(blocked) || borrow.isPending} onClick={() => { borrow.reset(); dialog.current?.showModal(); }}>Solicitar empréstimo</Button>
                  </>
                }
              </section>
            </div>
            <dialog ref={dialog} className="loan-dialog" aria-labelledby="confirmar-titulo" onCancel={(event) => { if (sending.current) event.preventDefault(); }}>
              <h2 id="confirmar-titulo">Confirmar empréstimo</h2>
              <p>{item.nome} · {item.patrimonio}</p>
              {item.devolucaoPrevista && <p className="loan-notice">Previsão de devolução em {formatDue(item.devolucaoPrevista)}.</p>}
              {borrow.error && <p className="loan-blocked" role="alert">{borrow.error.message}</p>}
              <div className="loan-dialog-actions">
                <Button className="loan-secondary" disabled={borrow.isPending} onClick={() => dialog.current?.close()}>Cancelar</Button>
                <Button disabled={borrow.isPending || Boolean(blocked) || item.situacao !== "disponivel"} onClick={submit}>
                  {borrow.isPending ? "Confirmando…" : "Confirmar empréstimo"}
                </Button>
              </div>
            </dialog>
          </>
        )}
    </LoanWorkspace>
  );
}
