import { describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { assertPixabayUrl, getBytes, normalizePhoto, prepareExport, previewPhoto, searchEquipment, sha256, validateReview } from "../../skills/imagens-equipamentos/scripts/pipeline.mjs";

const equipments = JSON.parse(readFileSync(new URL("../../skills/imagens-equipamentos/assets/equipamentos.json", import.meta.url), "utf8"));
const rootFixture = () => mkdtempSync(path.join(tmpdir(), "empresti-imagens-teste-"));
const writeJson = (file, value) => { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, JSON.stringify(value)); };
const photo = (id = 1001) => ({ id, type: "photo", pageURL: `https://pixabay.com/photos/item-${id}/`, largeImageURL: `https://cdn.pixabay.com/photo/${id}.jpg`, user: "Autor da fixture", user_id: 42, imageWidth: 1000, imageHeight: 800 });
const approval = (selection) => ({ patrimonio: selection.patrimonio, photoId: selection.photo.id, imageSha256: selection.imageSha256, reviewer: "Fixture de teste, não revisão de catálogo", reviewedAt: "2026-11-05T12:00:00.000Z", notes: "Dados sintéticos somente para testar as validações.", noPeople: true, noReadableBrands: true, noText: true, noScreenContent: true, correctEquipment: true });

async function preparedFixture() {
  const root = rootFixture();
  const approved = [];
  for (const [index, item] of equipments.entries()) {
    const hit = photo(1001 + index);
    writeJson(path.join(root, ".image-work/search", `${item.patrimonio}.json`), { query: item.busca, retrievedAt: "2026-11-05T11:00:00.000Z", hits: [hit] });
    const bytes = await sharp({ create: { width: 1000, height: 800, channels: 3, background: { r: 10 + index * 19, g: 70, b: 120 } } }).png().toBuffer();
    const selection = await previewPhoto(item, hit.id, { root, fetcher: async () => new Response(bytes, { headers: { "content-type": "image/png" } }) });
    approved.push(approval(selection));
  }
  writeJson(path.join(root, ".image-work/revisoes.json"), { approved, rejected: [] });
  return { root, approved };
}

describe("Preparação de imagens pela API do Pixabay", () => {
  it("test_ca_01_bloqueia_outros_hosts_esquemas_e_redirecionamentos", async () => {
    expect(assertPixabayUrl("https://cdn.pixabay.com/photo/1.jpg").hostname).toBe("cdn.pixabay.com");
    for (const url of ["http://pixabay.com/api/", "https://pixabay.com.evil.invalid/photo.jpg", "https://127.0.0.1/x", "https://usuario@pixabay.com/api/", "https://pixabay.com:8443/x"]) {
      expect(() => assertPixabayUrl(url)).toThrow();
    }
    let calls = 0;
    await expect(getBytes("https://cdn.pixabay.com/photo/1.jpg", { fetcher: async (_url, options) => { calls++; expect(options.method).toBe("GET"); return new Response(null, { status: 302, headers: { location: "https://outro.invalid/photo.jpg" } }); } })).rejects.toThrow("hosts do Pixabay");
    expect(calls).toBe(1);
  });

  it("test_ca_01_respeita_cache_24h_e_nao_grava_chave_ou_campos_desconhecidos", async () => {
    const root = rootFixture();
    mkdirSync(path.join(root, ".local-secrets"));
    const sentinel = "CHAVE_FICTICIA_APENAS_DO_TESTE";
    writeFileSync(path.join(root, ".local-secrets/pixabay.key"), sentinel);
    let calls = 0;
    let clock = Date.parse("2026-11-05T10:00:00Z");
    const fetcher = async (value, options) => {
      calls++;
      const url = new URL(value);
      expect(url.origin + url.pathname).toBe("https://pixabay.com/api/");
      expect(url.searchParams.get("key")).toBe(sentinel);
      expect(url.searchParams.get("image_type")).toBe("photo");
      expect(options.method).toBe("GET");
      return new Response(JSON.stringify({ hits: [{ ...photo(), unknown: sentinel }] }), { headers: { "content-type": "application/json" } });
    };
    await searchEquipment(equipments[0], { root, fetcher, now: () => clock });
    clock += 60 * 1000;
    await searchEquipment(equipments[0], { root, fetcher, now: () => clock });
    expect(calls).toBe(1);
    const cache = path.join(root, ".image-work/cache");
    expect(readFileSync(path.join(cache, readdirSync(cache)[0]), "utf8")).not.toContain(sentinel);
    clock += 24 * 60 * 60 * 1000;
    await searchEquipment(equipments[0], { root, fetcher, now: () => clock });
    expect(calls).toBe(2);
  });

  it("test_ca_01_erros_http_nao_repetem_url_chave_ou_corpo", async () => {
    const sentinel = "NAO_E_CHAVE_REAL";
    await expect(getBytes(`https://pixabay.com/api/?key=${sentinel}`, { api: true, fetcher: async () => new Response(sentinel, { status: 429 }) })).rejects.toThrow("HTTP 429");
    try { await getBytes(`https://pixabay.com/api/?key=${sentinel}`, { api: true, fetcher: async () => { throw new Error(sentinel); } }); } catch (error) { expect(error.message).not.toContain(sentinel); }
  });

  it("test_ca_01_interrupcao_do_corpo_nao_expoe_erro_do_transporte", async () => {
    const sentinel = "CREDENCIAL_FICTICIA_NO_ERRO_DO_STREAM";
    const stream = new ReadableStream({ start(controller) { controller.error(new Error(sentinel)); } });
    let failure;
    try {
      await getBytes("https://pixabay.com/api/", { api: true, fetcher: async () => new Response(stream, { headers: { "content-type": "application/json" } }) });
    } catch (error) { failure = error; }
    expect(failure).toBeInstanceOf(Error);
    expect(failure.message).not.toContain(sentinel);
    expect(failure.message).toContain("Resposta interrompida");
  });

  it("test_ca_01_respeita_janela_informada_pelo_provedor_e_serve_cache_sem_reconsultar", async () => {
    const root = rootFixture();
    mkdirSync(path.join(root, ".local-secrets"));
    writeFileSync(path.join(root, ".local-secrets/pixabay.key"), "FIXTURE_LOCAL");
    let calls = 0;
    let clock = Date.parse("2026-11-05T10:00:00Z");
    const fetcher = async () => {
      calls++;
      return new Response(JSON.stringify({ hits: [photo()] }), { headers: { "content-type": "application/json", "x-ratelimit-remaining": "0", "x-ratelimit-reset": "30" } });
    };
    const options = { root, fetcher, now: () => clock };
    await searchEquipment(equipments[0], options);
    await searchEquipment(equipments[0], options);
    await expect(searchEquipment(equipments[1], options)).rejects.toThrow("Limite do Pixabay");
    expect(calls).toBe(1);
    clock += 30001;
    await searchEquipment(equipments[1], options);
    expect(calls).toBe(2);
  });

  it("test_ca_02_processa_imagem_real_em_jpeg_800_600_sem_metadados", async () => {
    const input = await sharp({ create: { width: 1200, height: 700, channels: 3, background: "red" } }).png().toBuffer();
    const result = await normalizePhoto(input);
    const metadata = await sharp(result.bytes).metadata();
    expect([metadata.width, metadata.height, metadata.format]).toEqual([800, 600, "jpeg"]);
    expect(metadata.exif).toBeUndefined();
    expect(result.sha256).toBe(sha256(result.bytes));
    await expect(normalizePhoto(Buffer.from("<svg></svg>"))).rejects.toThrow("Somente fotos");
  });

  it("test_ca_03_bloqueia_revisao_incompleta_reprovada_ou_de_outro_hash", () => {
    const selection = { patrimonio: "TI-0001", photo: photo(), imageSha256: "abc" };
    const valid = approval(selection);
    expect(() => validateReview(valid, selection, "abc")).not.toThrow();
    for (const bad of [undefined, { ...valid, noPeople: false }, { ...valid, noText: undefined }, { ...valid, imageSha256: "outro" }, { ...valid, reviewer: "" }, { ...valid, reviewedAt: "inválida" }]) {
      expect(() => validateReview(bad, selection, "abc")).toThrow();
    }
  });

  it("test_ca_02_ca_04_ca_05_export_completo_idempotente_com_proveniencia_e_lista_exata", async () => {
    const { root } = await preparedFixture();
    const first = await prepareExport(equipments, { root });
    const manifestFile = path.join(first.exportDirectory, "manifest.json");
    const before = readFileSync(manifestFile, "utf8");
    const modified = statSync(manifestFile).mtimeMs;
    await prepareExport(equipments, { root });
    expect(readFileSync(manifestFile, "utf8")).toBe(before);
    expect(statSync(manifestFile).mtimeMs).toBe(modified);
    const manifest = JSON.parse(before);
    expect(manifest.images).toHaveLength(12);
    expect(manifest.images.filter((item) => item.situacao === "manutencao").map((item) => item.patrimonio)).toEqual(["TI-0004", "TI-0007", "TI-0010"]);
    expect(new Set(manifest.images.map((item) => item.photoId)).size).toBe(12);
    expect(new Set(manifest.images.map((item) => item.imageSha256)).size).toBe(12);
    expect(readdirSync(path.join(first.exportDirectory, "suporte_ti"))).toHaveLength(12);
    for (const item of manifest.images) {
      expect(item.source).toBe("pixabay");
      expect(item.photographer).toBeTruthy();
      expect(item.sourcePage).toMatch(/^https:\/\/pixabay.com\//);
      expect(item.license).toBe("Pixabay Content License");
      expect(item.storageKey).toBe(`suporte_ti/${item.patrimonio}.jpg`);
      expect(item.credit).toBe("Fotos: Pixabay");
      expect(item).not.toHaveProperty("largeImageURL");
      expect(item).not.toHaveProperty("key");
    }
  }, 20000);

  it("test_ca_02_ca_03_rejeita_mesma_foto_com_id_ou_hash_repetido_sem_export_parcial", async () => {
    const { root, approved } = await preparedFixture();
    const first = JSON.parse(readFileSync(path.join(root, ".image-work/selections/TI-0001-1001.json"), "utf8"));
    writeJson(path.join(root, ".image-work/selections/TI-0002-1001.json"), { ...first, patrimonio: "TI-0002" });
    approved[1] = { ...approved[1], photoId: 1001, imageSha256: approved[0].imageSha256 };
    writeJson(path.join(root, ".image-work/revisoes.json"), { approved });
    await expect(prepareExport(equipments, { root })).rejects.toThrow("mesma foto");
    expect(existsSync(path.join(root, ".image-work/export"))).toBe(false);
    const second = JSON.parse(readFileSync(path.join(root, ".image-work/selections/TI-0002-1002.json"), "utf8"));
    writeFileSync(path.join(root, ".image-work/candidates/1002.jpg"), readFileSync(path.join(root, ".image-work/candidates/1001.jpg")));
    writeJson(path.join(root, ".image-work/selections/TI-0002-1002.json"), { ...second, imageSha256: approved[0].imageSha256 });
    approved[1].photoId = 1002;
    writeJson(path.join(root, ".image-work/revisoes.json"), { approved });
    await expect(prepareExport(equipments, { root })).rejects.toThrow("mesma foto");
  }, 20000);

  it("test_ca_03_bloqueia_foto_aprovada_e_reprovada_para_o_mesmo_equipamento", async () => {
    const { root, approved } = await preparedFixture();
    writeJson(path.join(root, ".image-work/revisoes.json"), { approved, rejected: [{ ...approved[0], reason: "Texto legível na foto." }] });
    await expect(prepareExport(equipments, { root })).rejects.toThrow("também consta como reprovada");
    expect(existsSync(path.join(root, ".image-work/export"))).toBe(false);
  }, 20000);

  it("test_ca_05_revogacao_retira_export_anterior_e_preserva_copia_em_quarentena", async () => {
    const { root } = await preparedFixture();
    const first = await prepareExport(equipments, { root });
    const before = readFileSync(path.join(first.exportDirectory, "manifest.json"), "utf8");
    writeJson(path.join(root, ".image-work/revisoes.json"), { approved: [], rejected: [] });
    await expect(prepareExport(equipments, { root })).rejects.toThrow("exatamente 12");
    expect(existsSync(first.exportDirectory)).toBe(false);
    const archive = path.join(root, ".image-work/quarentena");
    const archived = readdirSync(archive);
    expect(archived).toHaveLength(1);
    expect(readFileSync(path.join(archive, archived[0], "manifest.json"), "utf8")).toBe(before);
  }, 20000);

  it("test_ca_05_nova_preparacao_remove_extras_do_pacote_sem_apagar_o_arquivo", async () => {
    const { root } = await preparedFixture();
    const first = await prepareExport(equipments, { root });
    writeFileSync(path.join(first.exportDirectory, "foto-nao-revisada.jpg"), "arquivo extra do teste");
    await prepareExport(equipments, { root });
    expect(readdirSync(first.exportDirectory).sort()).toEqual(["manifest.json", "suporte_ti"]);
    expect(readdirSync(path.join(first.exportDirectory, "suporte_ti"))).toHaveLength(12);
    const archive = path.join(root, ".image-work/quarentena");
    const archived = readdirSync(archive);
    expect(readFileSync(path.join(archive, archived[0], "foto-nao-revisada.jpg"), "utf8")).toBe("arquivo extra do teste");
  }, 20000);
});
