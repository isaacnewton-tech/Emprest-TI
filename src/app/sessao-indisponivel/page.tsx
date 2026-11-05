export default function SessionUnavailablePage() {
  return (
    <main className="session-page">
      <section className="session-panel" aria-labelledby="unavailable-title">
        <p className="brand">EmpresTI</p>
        <h1 id="unavailable-title">Não foi possível verificar sua sessão.</h1>
        <p role="alert">Não foi possível verificar sua sessão agora. Tente novamente.</p>
        <a className="button-primary" href="/catalogo">Tentar novamente</a>
        <p><a href="/login">Voltar ao login</a></p>
      </section>
    </main>
  );
}
