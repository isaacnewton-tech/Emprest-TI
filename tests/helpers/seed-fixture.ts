import { createHash } from "node:crypto";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import inventory from "../../skills/imagens-equipamentos/assets/equipamentos.json";

export const fixtureOrigin = "https://abcdefghijklmnopqrst.supabase.co";
export const professorId = "10000000-0000-4000-8000-000000000001";
export const testerId = "10000000-0000-4000-8000-000000000002";
export const hashImage = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

export async function makeSeedFixture() {
  const directory = await mkdtemp(path.join(tmpdir(), "empresti-seed-fixture-"));
  await mkdir(path.join(directory, "suporte_ti"));
  const images = await Promise.all(inventory.map(async (item, i) => {
    const id = 1001 + i;
    const storageKey = "suporte_ti/" + item.patrimonio + ".jpg";
    const bytes = await sharp({
      create: { width: 800, height: 600, channels: 3, background: { r: 15 + i * 15, g: 80, b: 120 } },
    }).jpeg().toBuffer();
    await writeFile(path.join(directory, storageKey), bytes);
    return {
      ...item, source: "pixabay", photoId: id, sourcePage: "https://pixabay.com/photos/fixture-" + id + "/",
      photographer: "Fixture", photographerProfile: "https://pixabay.com/users/Fixture-42/",
      license: "Pixabay Content License", licenseUrl: "https://pixabay.com/service/terms/",
      queryUsed: item.busca, retrievedAt: "2026-11-05T12:00:00Z",
      width: 800, height: 600, imageSha256: hashImage(bytes), transformation: { kind: "whole" },
      bucket: "equipamentos", storageKey, credit: "Fotos: Pixabay", creditUrl: "https://pixabay.com/",
      review: { reviewer: "Fixture local", reviewedAt: "2026-11-05T13:00:00Z", notes: "Teste sintético" },
    };
  }));
  const manifest = { source: "pixabay", equipmentCount: 12, images, rejected: [] };
  const writeManifest = () => writeFile(path.join(directory, "manifest.json"), JSON.stringify(manifest));
  await writeManifest();
  return {
    manifest,
    writeManifest,
    input: { packageDirectory: directory, professorId, testerId, storageOrigin: fixtureOrigin },
  };
}
