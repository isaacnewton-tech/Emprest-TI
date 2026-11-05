import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(254, "Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha.").max(1024, "Senha inválida."),
}).strict();
