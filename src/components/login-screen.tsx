"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

type LoginValues = z.infer<typeof loginSchema>;

function PackageIcon({ size = 21 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m12 2.5 8.5 4.8v9.4L12 21.5l-8.5-4.8V7.3L12 2.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="m3.7 7.5 8.3 4.7 8.3-4.7M12 12.2v9"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path d="m8 4.8 8.3 4.8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="17" viewBox="0 0 24 24" width="17">
      <path
        d="M4 12h15m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function LoginScreen() {
  const [notice, setNotice] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit() {
    setNotice("O acesso ainda não está disponível. Procure Operações.");
  }

  return (
    <main className="login-page" data-screen-label="01 Login">
      <div className="login-shell">
        <section className="login-hero" aria-labelledby="hero-title">
          <div className="brand">
            <span className="brand-mark">
              <PackageIcon size={20} />
            </span>
            <span>EmpresTI</span>
          </div>

          <div className="hero-content">
            <span className="eyebrow">EMPRÉSTIMO INTERNO</span>
            <h1 id="hero-title">Equipamentos disponíveis. Empréstimos registrados.</h1>
            <p>
              Consulte o catálogo, solicite um item e acompanhe o prazo de devolução em um só
              lugar.
            </p>
            <div className="brand-rule" aria-hidden="true" />
            <div className="hero-metrics" aria-label="Regras de empréstimo">
              <div className="hero-metric">
                <strong>3</strong>
                <span>itens por pessoa</span>
              </div>
              <div className="hero-metric">
                <strong>14</strong>
                <span>dias de prazo</span>
              </div>
            </div>
          </div>

          <p className="hero-footer">Operações · v1</p>
        </section>

        <section className="login-access" aria-labelledby="login-title">
          <div className="login-form-wrap">
            <div className="login-heading">
              <div className="login-heading-mark" aria-hidden="true" />
              <h2 id="login-title">Entrar</h2>
              <p>Acesse com sua conta de colaborador.</p>
            </div>

            <form noValidate onSubmit={handleSubmit(onSubmit)}>
              <div className="form-field">
                <label htmlFor="email">E-mail</label>
                <Input
                  {...register("email")}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  aria-invalid={Boolean(errors.email)}
                  autoComplete="email"
                  id="email"
                  inputMode="email"
                  placeholder="nome@empresa.com"
                  type="email"
                />
                {errors.email && (
                  <p className="field-error" id="email-error" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="password">Senha</label>
                <Input
                  {...register("password")}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  aria-invalid={Boolean(errors.password)}
                  autoComplete="current-password"
                  id="password"
                  placeholder="Sua senha"
                  type="password"
                />
                {errors.password && (
                  <p className="field-error" id="password-error" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button className="login-submit" type="submit">
                <span>Entrar</span>
                <ArrowIcon />
              </Button>
              {notice && (
                <p className="login-notice" role="status">
                  {notice}
                </p>
              )}
            </form>

            <div className="login-divider" aria-hidden="true" />
            <p className="login-help">Ainda não tem acesso? Solicite um convite a Operações.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
