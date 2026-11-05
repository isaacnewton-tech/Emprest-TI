import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareExport, previewPhoto, searchEquipment } from "./pipeline.mjs";

const asset = fileURLToPath(new URL("../assets/equipamentos.json", import.meta.url));
const equipments = JSON.parse(readFileSync(asset, "utf8"));
const root = process.cwd();

async function main() {
  const [command, patrimonio, ...queryParts] = process.argv.slice(2);
  if (command === "buscar") {
    const targets = patrimonio ? equipments.filter((item) => item.patrimonio === patrimonio) : equipments;
    if (!targets.length) throw new Error("Patrimônio não encontrado na lista da prática.");
    for (const item of targets) {
      const query = queryParts.length ? queryParts.join(" ") : item.busca;
      const result = await searchEquipment(item, { root, query });
      console.log(`${item.patrimonio}: ${result.hits.length} candidatos; IDs ${result.hits.map((hit) => hit.id).join(", ") || "nenhum"}.`);
    }
    return;
  }
  if (command === "previa") {
    const item = equipments.find((entry) => entry.patrimonio === patrimonio);
    const id = Number(queryParts[0]);
    if (!item || !Number.isSafeInteger(id) || id < 1 || queryParts.length !== 1) throw new Error("Use previa TI-0001 ID_DA_FOTO.");
    const selection = await previewPhoto(item, id, { root });
    console.log(JSON.stringify({ patrimonio, photoId: id, file: selection.candidateFile, imageSha256: selection.imageSha256 }));
    return;
  }
  if (command === "preparar" && !patrimonio) {
    const result = await prepareExport(equipments, { root });
    console.log(`${result.records.length} fotos aprovadas em ${path.relative(root, result.exportDirectory)}. Upload é execução manual do usuário.`);
    return;
  }
  if (command === "estado" && !patrimonio) {
    console.log(JSON.stringify({ provider: "pixabay", keyConfigured: existsSync(path.join(root, ".local-secrets", "pixabay.key")), reviewPresent: existsSync(path.join(root, ".image-work", "revisoes.json")) }));
    return;
  }
  throw new Error("Comandos: buscar [TI-0001] [termos alternativos], previa TI-0001 ID, preparar, estado. Não existe comando de upload.");
}

main().catch((error) => {
  // Somente mensagens controladas do programa; nunca imprimir URL da API ou pilha.
  const message = typeof error?.message === "string" ? error.message : "Falha na preparação local.";
  console.error(message.replace(/https?:\/\/\S+/g, "[URL omitida]").replace(/key=[^\s&]+/g, "key=[omitida]"));
  process.exitCode = 1;
});
