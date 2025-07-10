import { LibSQLVector } from "@mastra/libsql";

export const VALORANT_KNOWLEDGE_INDEX = "valorant_knowledge" as const;
export const valorantKnowledgeStore = new LibSQLVector({
	connectionUrl: "file:../knowledge.db",
});

export const createValorantKnowledgeIndex = async () => {
	await valorantKnowledgeStore.createIndex({
		indexName: VALORANT_KNOWLEDGE_INDEX,
		dimension: 768, // https://ai-sdk.dev/docs/ai-sdk-core/embeddings#embedding-providers--models
	});
};
