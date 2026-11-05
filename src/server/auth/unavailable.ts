import "server-only";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

const styles = `*{box-sizing:border-box}html{color-scheme:dark}body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:24px;background:#05070f;color:#e6eaf6;font-family:"Open Sans",system-ui,sans-serif}main{width:min(100%,620px);padding:clamp(24px,5vw,48px);border:1px solid #222c4a;border-radius:12px;background:#080c1a}h1{margin:32px 0 12px;font-size:clamp(22px,4vw,28px);font-weight:600;line-height:1.3}p{color:#8a93b2;line-height:1.6}.brand{margin:0;color:#e6eaf6;font-weight:600}a{color:#8aa6ee;text-decoration:none}a:hover{color:#b4c6f6}a:focus-visible{outline:2px solid #5b7fe0;outline-offset:2px}.retry{display:inline-flex;align-items:center;justify-content:center;min-height:44px;margin-top:20px;padding:0 20px;border:1px solid #5b7fe0;border-radius:8px;color:#b4c6f6;font-size:13px;font-weight:600}`;
const styleHash = createHash("sha256").update(styles).digest("base64");

export function sessionUnavailable() {
  // Resposta direta: a reescrita do Next normaliza uma página estática para HTTP 200.
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sessão indisponível | EmpresTI</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap"><style>${styles}</style></head><body><main aria-labelledby="unavailable-title"><p class="brand">EmpresTI</p><h1 id="unavailable-title">Acesso temporariamente indisponível</h1><p role="alert">Não foi possível verificar sua sessão agora. Tente novamente.</p><a class="retry" href="/catalogo">Tentar novamente</a><p><a href="/login">Voltar ao login</a></p></main></body></html>`;
  return new NextResponse(html, { status: 503, headers: {
    "content-type": "text/html; charset=utf-8",
    "content-security-policy": `default-src 'none'; style-src 'sha256-${styleHash}' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`,
  } });
}
