import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { Prisma, PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { z } from "zod";
import inventory from "../skills/imagens-equipamentos/assets/equipamentos.json" with { type: "json" };

const tenantSlug = "suporte_ti";
const bucket = "equipamentos";
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const nonEmpty = z.string().trim().min(1);
const dimensions = { width: z.literal(800), height: z.literal(600) };
const photoId = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const patrimonio = z.string().regex(/^TI-\d{4}$/);
const storageOrigin = z.string().regex(/^https:\/\/[a-z0-9]{20}\.supabase\.co\/?$/);
const region = z.strictObject({
  left: z.number().int().nonnegative(),
  top: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
}).refine((r) => r.left + r.width <= 800 && r.top + r.height <= 600);
const transformation = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("whole") }),
  z.strictObject({
    kind: z.literal("crop"), canvas: z.strictObject(dimensions), region, baseImageSha256: sha256,
  }),
]);
const manifestSchema = z.strictObject({
  source: z.literal("pixabay"),
  equipmentCount: z.literal(inventory.length),
  images: z.array(z.strictObject({
    patrimonio, nome: nonEmpty, busca: nonEmpty,
    categoria: z.enum(["notebook", "monitor", "cabo", "camera"]),
    situacao: z.enum(["disponivel", "manutencao"]),
    source: z.literal("pixabay"), photoId,
    sourcePage: z.url(), photographer: nonEmpty, photographerProfile: z.url(),
    license: z.literal("Pixabay Content License"),
    licenseUrl: z.literal("https://pixabay.com/service/terms/"),
    queryUsed: nonEmpty, retrievedAt: z.iso.datetime(),
    ...dimensions, imageSha256: sha256, transformation,
    bucket: z.literal(bucket), storageKey: nonEmpty,
    credit: z.literal("Fotos: Pixabay"), creditUrl: z.literal("https://pixabay.com/"),
    review: z.strictObject({ reviewer: nonEmpty, reviewedAt: z.iso.datetime(), notes: nonEmpty }),
  })).length(inventory.length),
  rejected: z.array(z.object({ patrimonio, photoId, imageSha256: sha256.optional() })),
});
const seedOptions = z.strictObject({
  packageDirectory: nonEmpty,
  professorId: z.uuid().transform((value) => value.toLowerCase()),
  testerId: z.uuid().transform((value) => value.toLowerCase()),
  storageOrigin,
}).refine((input) => input.professorId !== input.testerId);

class SeedError extends Error {}

async function packageFile(directory: string, name: string, maxBytes: number) {
  const file = path.join(directory, name);
  try {
    const info = await stat(file);
    if (!info.isFile() || info.size > maxBytes) throw new Error();
    return await readFile(file);
  } catch {
    throw new SeedError("Arquivo ausente ou inválido no pacote: " + name + ".");
  }
}

function pixabayPath(value: string) {
  const url = new URL(value);
  if (url.origin !== "https://pixabay.com" || url.username || url.password || url.search || url.hash) {
    throw new SeedError("O manifesto contém origem fora do Pixabay.");
  }
  return url.pathname;
}

async function validateImages(directory: string, origin: string) {
  const raw = await packageFile(directory, "manifest.json", 2 * 1024 * 1024);
  let manifest: unknown;
  try { manifest = JSON.parse(raw.toString("utf8")); }
  catch { throw new SeedError("O manifesto não é um JSON válido."); }
  const result = manifestSchema.safeParse(manifest);
  if (!result.success) throw new SeedError("Manifesto inválido. Use o pacote completo da entrega de imagens.");

  const { images, rejected } = result.data;
  const byPatrimonio = new Map(images.map((photo) => [photo.patrimonio, photo]));
  if (byPatrimonio.size !== inventory.length ||
      new Set(images.map((photo) => photo.photoId)).size !== inventory.length ||
      new Set(images.map((photo) => photo.imageSha256)).size !== inventory.length) {
    throw new SeedError("O manifesto tem patrimônios, IDs ou hashes repetidos.");
  }

  return Promise.all(inventory.map(async (item) => {
    const photo = byPatrimonio.get(item.patrimonio);
    const storageKey = tenantSlug + "/" + item.patrimonio + ".jpg";
    if (!photo || photo.storageKey !== storageKey || photo.nome !== item.nome ||
        photo.categoria !== item.categoria || photo.situacao !== item.situacao || photo.busca !== item.busca) {
      throw new SeedError("O manifesto não corresponde à lista para " + item.patrimonio + ".");
    }
    const sourcePage = pixabayPath(photo.sourcePage);
    const profilePath = pixabayPath(photo.photographerProfile);
    const authorPrefix = "/users/" + encodeURIComponent(photo.photographer) + "-";
    if (!sourcePage.startsWith("/photos/") || !sourcePage.endsWith("-" + photo.photoId + "/") ||
        !profilePath.startsWith(authorPrefix) || !/^\d+\/$/.test(profilePath.slice(authorPrefix.length))) {
      throw new SeedError("Página da foto ou autor inconsistente para " + item.patrimonio + ".");
    }
    if (rejected.some((entry) => entry.patrimonio === item.patrimonio &&
        (entry.imageSha256 ? entry.imageSha256 === photo.imageSha256 : entry.photoId === photo.photoId))) {
      throw new SeedError("O manifesto inclui foto reprovada para " + item.patrimonio + ".");
    }

    const bytes = await packageFile(directory, storageKey, 15 * 1024 * 1024);
    if (createHash("sha256").update(bytes).digest("hex") !== photo.imageSha256) {
      throw new SeedError("O SHA-256 da foto diverge do manifesto para " + item.patrimonio + ".");
    }
    const metadata = await sharp(bytes, { limitInputPixels: 800 * 600 }).metadata().catch(() => null);
    if (metadata?.format !== "jpeg" || metadata.width !== 800 || metadata.height !== 600) {
      throw new SeedError("A foto precisa ser JPEG 800×600 para " + item.patrimonio + ".");
    }

    const { patrimonio, nome, categoria, situacao, ...photoSource } = photo;
    const photoUrl = new URL("/storage/v1/object/public/" + bucket + "/" + storageKey, origin).href;
    return { patrimonio, nome, categoria, situacao, photoUrl, photoSource };
  }));
}

function parseSeedOptions(input: unknown) {
  const options = seedOptions.safeParse(input);
  if (!options.success) {
    throw new SeedError("Informe o pacote, dois UUIDs distintos de usuários e a URL pública do projeto Supabase.");
  }
  return options.data;
}

export async function seedInitialData(prisma: PrismaClient, input: z.input<typeof seedOptions>) {
  const options = parseSeedOptions(input);
  const images = await validateImages(options.packageDirectory, options.storageOrigin);

  return prisma.$transaction(async (tx) => {
    await tx.tenant.createMany({ data: { slug: tenantSlug }, skipDuplicates: true });
    const tenant = await tx.tenant.findUniqueOrThrow({ where: { slug: tenantSlug } });
    const users = [options.professorId, options.testerId].sort();
    await tx.membership.createMany({
      data: users.map((userId) => ({ userId, tenantId: tenant.id, role: "colaborador" })),
      skipDuplicates: true,
    });
    const links = await tx.membership.findMany({
      where: { tenantId: tenant.id, userId: { in: users } },
    });
    if (links.length !== 2 || links.some((link) => link.role !== "colaborador")) {
      throw new SeedError("Há vínculo com papel diferente de Colaborador. Confira os IDs no Supabase Auth.");
    }

    const report = { criados: [] as string[], sincronizados: [] as string[], preservados: [] as string[] };
    for (const { patrimonio, ...values } of images) {
      const key = { tenantId: tenant.id, patrimonio };
      const inserted = await tx.equipment.createMany({ data: { ...key, ...values }, skipDuplicates: true });
      if (inserted.count === 1) {
        report.criados.push(patrimonio);
        continue;
      }
      // A condição faz parte do UPDATE, inclusive se uma transação de empréstimo
      // marcar o primeiro uso depois da tentativa de inserção.
      const updated = await tx.equipment.updateMany({ where: { ...key, firstUsedAt: null }, data: values });
      if (updated.count === 1) report.sincronizados.push(patrimonio);
      else report.preservados.push(patrimonio);
    }

    return { tenant: tenantSlug, equipamentos: report, vinculosColaborador: links.length, emprestimosCriados: 0 };
  }, { timeout: 30_000 });
}

function connectionForSeed(value: string | undefined, origin: string, production: boolean) {
  let url: URL;
  try { url = new URL(value ?? ""); } catch { throw new SeedError("Configure DIRECT_URL antes de rodar o seed."); }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new SeedError("DIRECT_URL precisa apontar para PostgreSQL.");
  if (["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) return url.href;
  if (!production) throw new SeedError("Conexão remota exige --confirmar-producao e execução pelo responsável.");

  const ref = new URL(origin).hostname.split(".")[0];
  const direct = url.hostname === "db." + ref + ".supabase.co";
  const sessionPooler = url.hostname.endsWith(".pooler.supabase.com") && url.username.endsWith("." + ref);
  if ((!direct && !sessionPooler) || (url.port || "5432") !== "5432" ||
      url.searchParams.get("pgbouncer") === "true" || url.searchParams.get("sslmode") !== "require") {
    throw new SeedError("Use a conexão direta ou o pooler de sessão TLS do mesmo projeto Supabase na porta 5432.");
  }
  return url.href;
}

async function main() {
  let args;
  try {
    args = parseArgs({ options: {
      pacote: { type: "string" },
      "professor-id": { type: "string" },
      "teste-id": { type: "string" },
      "confirmar-producao": { type: "boolean" },
    } }).values;
  } catch {
    throw new SeedError("Uso: npm run db:seed -- --pacote PASTA --professor-id UUID --teste-id UUID");
  }
  const input = parseSeedOptions({
    packageDirectory: args.pacote,
    professorId: args["professor-id"],
    testerId: args["teste-id"],
    storageOrigin: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
  const url = connectionForSeed(process.env.DIRECT_URL, input.storageOrigin, args["confirmar-producao"] === true);
  const prisma = new PrismaClient({ datasourceUrl: url });
  try {
    console.log(JSON.stringify(await seedInitialData(prisma, input), null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    if (error instanceof SeedError) console.error(error.message);
    else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      console.error("As tabelas do seed não existem. Aplique as migrações antes de continuar.");
    } else {
      console.error("O seed falhou. Confira a conexão, as migrações e as permissões do banco.");
    }
    process.exitCode = 1;
  });
}
