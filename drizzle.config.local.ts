import { defineConfig } from "drizzle-kit";
export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "./migrations",
	dialect: "sqlite",
	dbCredentials: {
		// biome-ignore lint/style/noNonNullAssertion: env
		url: process.env.VALORANT_STORE_URL!,
	},
});
