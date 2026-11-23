import { readFileSync } from "node:fs";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const BASE = "http://127.0.0.1:8317";
const CONF = "/opt/homebrew/etc/cliproxyapi.conf";

export default async function (pi: ExtensionAPI) {
  const key = readFileSync(CONF, "utf8").match(/^api-keys:\s*\n\s*-\s*"?([^"\s]+)"?/m)?.[1];
  if (!key) throw new Error("quotio: no api-keys entry in " + CONF);
  const res = await fetch(BASE + "/v1/models", { headers: { Authorization: "Bearer " + key } });
  const { data } = (await res.json()) as { data: { id: string; owned_by: string }[] };
  pi.registerProvider("quotio", {
    baseUrl: BASE,
    apiKey: key,
    api: "anthropic-messages",
    models: data
      .filter((m) => m.owned_by === "antigravity" && !m.id.includes("image"))
      .map((m) => ({
        id: m.id,
        name: m.id,
        reasoning: true,
        input: ["text"] as ("text" | "image")[],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 200000,
        maxTokens: 16000,
      })),
  });
}
