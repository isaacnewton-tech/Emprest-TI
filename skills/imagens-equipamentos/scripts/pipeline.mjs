import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const DAY = 24 * 60 * 60 * 1000;
const MAX_BYTES = 15 * 1024 * 1024;
const visualChecks = ["noPeople", "noReadableBrands", "noText", "noScreenContent", "correctEquipment"];

export function assertPixabayUrl(value, api = false) {
  let url;
  try { url = new URL(value); } catch { throw new Error("URL inválida do provedor."); }
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || !["pixabay.com", "cdn.pixabay.com"].includes(url.hostname)) {
    throw new Error("Somente HTTPS nos hosts do Pixabay é permitido.");
  }
  if (api && (url.hostname !== "pixabay.com" || url.pathname !== "/api/")) throw new Error("Endpoint de API não permitido.");
  return url;
}

export async function getBytes(value, { api = false, fetcher = fetch, onRateLimit } = {}) {
  let url = assertPixabayUrl(value, api);
  for (let redirects = 0; redirects < 4; redirects++) {
    let response;
    try {
      response = await fetcher(url.toString(), { method: "GET", redirect: "manual", credentials: "omit", signal: AbortSignal.timeout(15000) });
    } catch { throw new Error("Falha de rede ao consultar o Pixabay; URL e credencial omitidas."); }
    if (api && onRateLimit) {
      const remaining = response.headers.get("x-ratelimit-remaining");
      if (response.status === 429 || (remaining !== null && Number(remaining) === 0)) {
        const reset = Number(response.headers.get("x-ratelimit-reset"));
        onRateLimit(Number.isFinite(reset) && reset > 0 ? Math.min(reset, 86400) : 60);
      }
    }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirecionamento sem destino.");
      url = assertPixabayUrl(new URL(location, url).toString(), api);
      continue;
    }
    if (!response.ok) throw new Error(`Pixabay retornou HTTP ${response.status}; aguarde antes de repetir a consulta.`);
    if (Number(response.headers.get("content-length")) > MAX_BYTES) throw new Error("Resposta excede o limite de tamanho.");
    const type = response.headers.get("content-type") ?? "";
    if (api ? !type.includes("application/json") : !/^image\/(jpeg|png|webp)(?:;|$)/i.test(type)) throw new Error("Tipo de resposta do Pixabay não permitido.");
    const chunks = [];
    let size = 0;
    try {
      for await (const chunk of response.body) {
        size += chunk.length;
        if (size > MAX_BYTES) throw new Error("Limite de tamanho.");
        chunks.push(Buffer.from(chunk));
      }
    } catch { throw new Error("Resposta interrompida ou acima do limite; URL e credencial omitidas."); }
    return Buffer.concat(chunks);
  }
  throw new Error("Limite de redirecionamentos excedido.");
}

function photoRecord(hit) {
  if (hit.type !== "photo" || !Number.isSafeInteger(hit.id) || hit.id < 1 || !Number.isSafeInteger(hit.imageWidth) || !Number.isSafeInteger(hit.imageHeight) || hit.imageWidth < 800 || hit.imageHeight < 600 || typeof hit.user !== "string" || !hit.user.trim() || !Number.isSafeInteger(hit.user_id)) return null;
  try {
    const page = assertPixabayUrl(hit.pageURL);
    const large = assertPixabayUrl(hit.largeImageURL);
    if (page.hostname !== "pixabay.com" || page.searchParams.has("key") || large.searchParams.has("key")) return null;
    return { id: hit.id, type: "photo", pageURL: page.toString(), largeImageURL: large.toString(), user: hit.user, user_id: hit.user_id, imageWidth: hit.imageWidth, imageHeight: hit.imageHeight };
  } catch { return null; }
}

function writeStable(file, data) {
  const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (existsSync(file) && readFileSync(file).equals(bytes)) return false;
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, bytes);
  return true;
}

const json = (file, value) => writeStable(file, `${JSON.stringify(value, null, 2)}\n`);
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

export async function searchEquipment(equipment, { root, query = equipment.busca, fetcher = fetch, now = Date.now } = {}) {
  if (!/^TI-\d{4}$/.test(equipment.patrimonio) || typeof query !== "string" || query.length < 1 || query.length > 100) throw new Error("Patrimônio ou consulta inválida.");
  const params = new URLSearchParams({ q: query, image_type: "photo", safesearch: "true", orientation: "horizontal", min_width: "800", min_height: "600", per_page: "10" });
  const cacheId = sha256(params.toString());
  const cacheFile = path.join(root, ".image-work", "cache", `${cacheId}.json`);
  let cached;
  if (existsSync(cacheFile)) {
    const candidate = readJson(cacheFile);
    if (candidate.cachedAt <= now() && now() - candidate.cachedAt < DAY && Array.isArray(candidate.hits)) {
      cached = { ...candidate, hits: candidate.hits.map(photoRecord).filter(Boolean) };
    }
  }
  if (!cached) {
    const limitFile = path.join(root, ".image-work", "cache", "rate-limit.json");
    if (existsSync(limitFile) && readJson(limitFile).retryAfter > now()) throw new Error("Limite do Pixabay atingido; aguarde o prazo informado antes de consultar novamente.");
    const keyFile = path.join(root, ".local-secrets", "pixabay.key");
    if (!existsSync(keyFile)) throw new Error("Configure a chave local em .local-secrets/pixabay.key; não a passe por argumento.");
    const key = readFileSync(keyFile, "utf8").trim();
    if (!key) throw new Error("A chave local do Pixabay está vazia.");
    params.set("key", key);
    const bytes = await getBytes(`https://pixabay.com/api/?${params}`, { api: true, fetcher, onRateLimit: (seconds) => json(limitFile, { retryAfter: now() + seconds * 1000 }) });
    let result;
    try { result = JSON.parse(bytes.toString("utf8")); } catch { throw new Error("Resposta JSON inválida do Pixabay; conteúdo omitido."); }
    if (!Array.isArray(result.hits)) throw new Error("Resposta sem resultados de fotos no formato esperado.");
    cached = { cachedAt: now(), hits: result.hits.map(photoRecord).filter(Boolean) };
    json(cacheFile, cached);
  }
  const result = { patrimonio: equipment.patrimonio, query, retrievedAt: new Date(cached.cachedAt).toISOString(), hits: cached.hits };
  json(path.join(root, ".image-work", "search", `${equipment.patrimonio}.json`), result);
  return result;
}

export async function normalizePhoto(bytes) {
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const webp = bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
  if (!jpeg && !png && !webp) throw new Error("Somente fotos JPEG, PNG ou WebP podem ser processadas.");
  let output;
  try {
    output = await sharp(bytes, { limitInputPixels: 40000000 }).rotate().resize(800, 600, { fit: "contain", background: "#ffffff" }).flatten({ background: "#ffffff" }).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  } catch { throw new Error("Foto inválida ou acima dos limites de processamento."); }
  const metadata = await sharp(output).metadata();
  if (metadata.width !== 800 || metadata.height !== 600 || metadata.format !== "jpeg") throw new Error("Foto processada não passou na verificação 800×600 JPEG.");
  return { bytes: output, sha256: sha256(output), width: 800, height: 600 };
}

export async function previewPhoto(equipment, photoId, { root, fetcher = fetch } = {}) {
  const searchFile = path.join(root, ".image-work", "search", `${equipment.patrimonio}.json`);
  if (!existsSync(searchFile)) throw new Error("Busque candidatos desse equipamento antes de criar a prévia.");
  const search = readJson(searchFile);
  const photo = search.hits.map(photoRecord).find((hit) => hit?.id === photoId);
  if (!photo) throw new Error("A foto precisa estar nos resultados da API para esse equipamento.");
  const originalFile = path.join(root, ".image-work", "originals", `${photo.id}.bin`);
  const original = existsSync(originalFile) ? readFileSync(originalFile) : await getBytes(photo.largeImageURL, { fetcher });
  writeStable(originalFile, original);
  const normalized = await normalizePhoto(original);
  const candidateFile = path.join(root, ".image-work", "candidates", `${photo.id}.jpg`);
  writeStable(candidateFile, normalized.bytes);
  const selection = { patrimonio: equipment.patrimonio, query: search.query, retrievedAt: search.retrievedAt, photo, imageSha256: normalized.sha256, candidateFile: `.image-work/candidates/${photo.id}.jpg` };
  json(path.join(root, ".image-work", "selections", `${equipment.patrimonio}-${photo.id}.json`), selection);
  return selection;
}

export function validateReview(review, selection, actualHash) {
  if (!review || review.patrimonio !== selection.patrimonio || review.photoId !== selection.photo.id || review.imageSha256 !== actualHash || selection.imageSha256 !== actualHash) throw new Error("Revisão ausente ou vinculada a outra imagem/hash.");
  if (!visualChecks.every((field) => review[field] === true)) throw new Error("A imagem não tem todas as condições visuais aprovadas.");
  if (typeof review.reviewer !== "string" || !review.reviewer.trim() || typeof review.notes !== "string" || !review.notes.trim() || typeof review.reviewedAt !== "string" || !Number.isFinite(Date.parse(review.reviewedAt))) throw new Error("A revisão precisa de responsável, data e observações.");
}

export async function prepareExport(equipments, { root } = {}) {
  const reviewFile = path.join(root, ".image-work", "revisoes.json");
  if (!existsSync(reviewFile)) throw new Error("Falta a revisão visual em .image-work/revisoes.json. Nenhum export liberado.");
  const reviews = readJson(reviewFile);
  if (!Array.isArray(reviews.approved) || reviews.approved.length !== equipments.length || equipments.length !== 12) throw new Error("O export exige exatamente 12 revisões aprovadas, uma por equipamento.");
  const ids = new Set();
  const hashes = new Set();
  const records = [];
  const files = [];
  for (const equipment of equipments) {
    const matches = reviews.approved.filter((entry) => entry.patrimonio === equipment.patrimonio);
    if (matches.length !== 1) throw new Error("Cada patrimônio precisa de exatamente uma revisão.");
    const review = matches[0];
    if (!Number.isSafeInteger(review.photoId) || review.photoId < 1) throw new Error("ID de foto inválido na revisão.");
    const selectionFile = path.join(root, ".image-work", "selections", `${equipment.patrimonio}-${review.photoId}.json`);
    if (!existsSync(selectionFile)) throw new Error("Seleção não encontrada entre as prévias preparadas.");
    const selection = readJson(selectionFile);
    const photo = photoRecord(selection.photo);
    if (!photo) throw new Error("Seleção sem proveniência válida do Pixabay.");
    const bytes = readFileSync(path.join(root, ".image-work", "candidates", `${photo.id}.jpg`));
    const hash = sha256(bytes);
    validateReview(review, selection, hash);
    const metadata = await sharp(bytes).metadata();
    if (metadata.width !== 800 || metadata.height !== 600 || metadata.format !== "jpeg") throw new Error("Dimensões ou formato alterados após a revisão.");
    if (ids.has(photo.id) || hashes.has(hash)) throw new Error("Uma mesma foto não pode ser usada em dois equipamentos.");
    ids.add(photo.id); hashes.add(hash);
    const storageKey = `suporte_ti/${equipment.patrimonio}.jpg`;
    files.push({ name: storageKey, bytes });
    records.push({ ...equipment, source: "pixabay", photoId: photo.id, sourcePage: photo.pageURL, photographer: photo.user, photographerProfile: `https://pixabay.com/users/${encodeURIComponent(photo.user)}-${photo.user_id}/`, license: "Pixabay Content License", licenseUrl: "https://pixabay.com/service/terms/", queryUsed: selection.query, retrievedAt: selection.retrievedAt, width: 800, height: 600, imageSha256: hash, bucket: "equipamentos", storageKey, credit: "Fotos: Pixabay", creditUrl: "https://pixabay.com/", review: { reviewer: review.reviewer, reviewedAt: review.reviewedAt, notes: review.notes } });
  }
  // Nenhuma escrita de export ocorre antes de validar o conjunto inteiro.
  const exportDirectory = path.join(root, ".image-work", "export");
  for (const file of files) writeStable(path.join(exportDirectory, file.name), file.bytes);
  json(path.join(exportDirectory, "manifest.json"), { source: "pixabay", equipmentCount: 12, images: records, rejected: Array.isArray(reviews.rejected) ? reviews.rejected : [] });
  return { exportDirectory, records };
}
