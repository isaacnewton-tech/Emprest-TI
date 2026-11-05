import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export function createContext({ req, resHeaders }: Pick<FetchCreateContextFnOptions, "req" | "resHeaders">) {
  return { request: req, responseHeaders: resHeaders, requestId: crypto.randomUUID() };
}

export type TRPCContext = Awaited<ReturnType<typeof createContext>>;
