import { defineConfig } from "drizzle-kit";
export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "./migrations",
	dialect: "turso",
	dbCredentials: {
		// biome-ignore lint/style/noNonNullAssertion: env
		url: process.env.VALORANT_STORE_URL!,
		// biome-ignore lint/style/noNonNullAssertion: env
		authToken: process.env.VALORANT_STORE_AUTH_TOKEN!,
	},
});
