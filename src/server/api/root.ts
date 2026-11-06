import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { catalogoRouter } from "./routers/catalogo";
import { emprestimosRouter } from "./routers/emprestimos";

export const appRouter = router({ auth: authRouter, catalogo: catalogoRouter, emprestimos: emprestimosRouter });
export type AppRouter = typeof appRouter;
