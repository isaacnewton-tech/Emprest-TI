import "server-only";
import { z } from "zod";

const authEnvironment = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export function getAuthConfig(environment: Record<string, string | undefined> = process.env) {
  const result = authEnvironment.safeParse(environment);
  if (!result.success) throw new Error("Configuração de autenticação indisponível.");
  return {
    url: result.data.NEXT_PUBLIC_SUPABASE_URL,
    key: result.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    secureCookies: environment.NODE_ENV === "production",
  };
}

// Falhar ao carregar o servidor se a configuração obrigatória estiver ausente.
getAuthConfig();
