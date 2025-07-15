import { google } from "@ai-sdk/google";
import { createStep, createWorkflow } from "@mastra/core";
import { MDocument } from "@mastra/rag";
import { embedMany } from "ai";
import { z } from "zod";
import {
	createValorantKnowledgeVectorIndex,
	VALORANT_KNOWLEDGE_INDEX,
	valorantKnowledgeVectorStore,
} from "../stores/valorantKnowledgeVectorStore";
import { webSearchTool } from "../tools/google-tools";

const saveKnowledge = createStep({
	id: "save-valorant-knowledge",
	description: "save valorant knowledge",
	inputSchema: z.string().nullish(),
	outputSchema: z.object({ success: z.boolean() }),
	execute: async ({ inputData }) => {
		await createValorantKnowledgeVectorIndex();

		if (!inputData) return { success: false };

		const doc = MDocument.fromText(inputData);
		const chunks = await doc.chunk();
		const { embeddings } = await embedMany({
			values: chunks.map((chunk) => chunk.text),
			model: google.textEmbeddingModel("text-embedding-004"),
		});
		await valorantKnowledgeVectorStore.upsert({
			indexName: VALORANT_KNOWLEDGE_INDEX,
			vectors: embeddings,
			metadata: chunks.map((c) => c.metadata),
		});
		return { success: true };
	},
});

const valorantSaveKnowledgeWorkflow = createWorkflow({
	id: "valorant-save-knowledge-workflow",
	description: "valorant の情報を Google 検索して RAG に保存する",
	inputSchema: z.object({
		word: z.string(),
	}),
	outputSchema: z.array(z.object({ success: z.boolean() })),
})
	.then(createStep(webSearchTool))
	.then(saveKnowledge);

valorantSaveKnowledgeWorkflow.commit();

export { valorantSaveKnowledgeWorkflow };
