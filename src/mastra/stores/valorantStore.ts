import { LibSQLStore } from "@mastra/libsql";

export const valorantStore = new LibSQLStore({
	// biome-ignore lint/style/noNonNullAssertion: env
	url: process.env.VALORANT_STORE_URL!,
	authToken: process.env.VALORANT_STORE_AUTH_TOKEN,
});
