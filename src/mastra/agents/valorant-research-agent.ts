import { google } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { createVectorQueryTool } from "@mastra/rag";
import { VALORANT_KNOWLEDGE_INDEX } from "../stores/valorantKnowledgeVectorStore";
import { valorantStore } from "../stores/valorantStore";
import { getValorantContentTool } from "../tools/valorant-api-fetch-tools";
import { valorantSaveKnowledgeWorkflow } from "../workflows/valorant-save-knowledge-workflow";

const vectorQueryTool = createVectorQueryTool({
	description: "コーチによる valorant の試合評価結果が格納されている",
	vectorStoreName: "valorantKnowledgeVectorStore",
	indexName: VALORANT_KNOWLEDGE_INDEX,
	model: google.textEmbeddingModel("text-embedding-004"),
	reranker: {
		model: google("gemini-2.5-flash"),
	},
});

export const valorantResearchAgent = new Agent({
	name: "valorantResearchAgent",
	description:
		"Valorant に関する情報を検索したり、その結果をベクター DB に保存したりするエージェント",
	instructions: `
    あなたは、VALORANTに関するトピックについて調査し、信頼できる情報源から内容を要約して、知識ベース用のドキュメントを生成する専門家です。
    最終的な成果物は、要点がまとまった、簡潔で分かりやすいマークダウン形式のテキストです。
    回答には、必ず参考にした情報源（URL）を引用として含めてください。
    
    また、基本情報が必要な場合は getValorantContentTool 等で最新情報を取得し、検索ワードを組み立ててください。
`,
	model: google("gemini-2.5-flash"),
	tools: { vectorQueryTool, getValorantContentTool },
	workflows: { valorantSaveKnowledgeWorkflow },
	memory: new Memory({
		storage: valorantStore,
	}),
});
