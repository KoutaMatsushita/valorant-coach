import { LibSQLVector } from "@mastra/libsql";

export const VALORANT_KNOWLEDGE_INDEX = "valorant_knowledge" as const;
export const valorantKnowledgeVectorStore = new LibSQLVector({
	// biome-ignore lint/style/noNonNullAssertion: env
	connectionUrl: process.env.VALORANT_KNOWLEDGE_VECTOR_URL!,
	authToken: process.env.VALORANT_KNOWLEDGE_AUTH_TOKEN,
});

export const createValorantKnowledgeVectorIndex = async () => {
	await valorantKnowledgeVectorStore.createIndex({
		indexName: VALORANT_KNOWLEDGE_INDEX,
		dimension: 768, // https://ai-sdk.dev/docs/ai-sdk-core/embeddings#embedding-providers--models
	});
};
