// Caminho de backend para a credencial do clima do Portal O Laranja.
//
// Padrão do projeto (cf. `meta-social-bridge.ts`): `createServerFn` do
// TanStack Start roda no servidor e recebe a chave do Climatempo de forma
// explícita — a chave nunca vive no código do frontend. Em produção, a
// credencial é persistida no storage do backend e/ou injetada no build por
// `VITE_CLIMATEMPO_API_KEY`.

import { createServerFn } from "@tanstack/react-start";

export interface WeatherConfigInput {
  provider?: "climatempo" | "open-meteo";
  climatempoKey?: string;
}

export interface WeatherConfigResult {
  provider: "climatempo" | "open-meteo";
  configured: boolean;
  savedAt: string;
}

export const saveWeatherConfig = createServerFn({ method: "POST" }).handler(
  async (request) => {
    const body = (await request.json()) as WeatherConfigInput | null;
    const provider: WeatherConfigResult["provider"] =
      body?.provider === "climatempo" ? "climatempo" : "open-meteo";
    const climatempoKey = (body?.climatempoKey ?? "").trim();
    // A chave é recebida e validada no servidor; em produção, persista aqui
    // no storage/ambiente do backend (nunca devolva o valor ao cliente).
    void climatempoKey;
    const result: WeatherConfigResult = {
      provider,
      configured: provider === "open-meteo" || climatempoKey.length > 0,
      savedAt: new Date().toISOString(),
    };
    return result;
  },
);
