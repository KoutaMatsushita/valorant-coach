import { google } from "@ai-sdk/google";
import { createStep, createWorkflow } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { MDocument } from "@mastra/rag";
import { type Embedding, embedMany } from "ai";
import { z } from "zod";
import { extractPlayerDataForAI_V4 } from "../lib/extractPlayerDataForAI_V4";
import {
	AccountSchema,
	getAccount,
	getMatchesByPuuid,
	MatchV4Schema,
	ModeSchema,
	PlatformSchema,
	RegionSchema,
} from "../lib/valorant-api";
import {
	createValorantKnowledgeIndex,
	VALORANT_KNOWLEDGE_INDEX,
	valorantKnowledgeStore,
} from "../stores/valorantKnowledgeStore";

const fetchAccount = createStep({
	id: "fetch-valorant-account",
	description: "fetch valorant account",
	inputSchema: z.object({
		name: z.string(),
		tag: z.string(),
		platform: PlatformSchema,
		mode: ModeSchema,
		region: RegionSchema,
		size: z.number().min(1).max(10).default(5).describe("取得する試合件数"),
	}),
	outputSchema: AccountSchema,
	execute: async ({ inputData: { name, tag } }) => {
		return await getAccount(name, tag);
	},
});

const fetchMatches = createStep({
	id: "fetch-valorant-match",
	description: "fetch valorant match",
	inputSchema: AccountSchema,
	outputSchema: z.array(MatchV4Schema),
	execute: async ({ inputData: { puuid }, getInitData }) => {
		const { platform, region, mode, size } = getInitData();
		return await getMatchesByPuuid(puuid, region, platform, mode, size);
	},
});

const valorantCoachiKnowledgeAgent = new Agent({
	name: "valorantCoachiKnowledgeAgent",
	instructions: `
        あなたはValorantの熟練コーチングAIです。
        
        渡されたデータに基づいて、プレイヤーの強み、弱み、そして具体的な改善点に関するコーチングアドバイス**を生成してください。
        特に以下の点を重視してください:
        1.  **全体的なパフォーマンス評価**: KDA、ACS（スコアから算出可能）、ダメージ、エコノミー運用（使った金額と残った金額）。
        2.  **ラウンドごとの要約と重要イベント**: 各ラウンドでのキル、デス、スパイクプラント/解除の関与、エコノミー状況、アビリティ使用。
        3.  **キル/デスイベントの分析**: どの武器でキルしたか、誰にキルされたか、アシストがあったかなど、重要な交戦の状況。
        4.  **アビリティ使用の評価**: アビリティキャスト数やそのタイミングに関する考察。
        5.  **具体的な改善アドバイス**: どこで何を改善できるか、具体的な行動を提案してください。例えば、エコノミーが悪いラウンドでの購入判断、特定の状況でのアビリティの使い方、交戦時の立ち位置など。

        出力は、直接プレイヤーに語りかけるような、**親しみやすく建設的なトーン**でお願いします。
        感情的な評価ではなく、データに基づいた客観的な分析を心がけてください。
    `,
	model: google("gemini-2.5-flash"),
});

const saveKnowledge = createStep({
	id: "save-knowledge",
	description: "save valorant match",
	inputSchema: MatchV4Schema,
	outputSchema: z.object({ success: z.boolean() }),
	execute: async ({ inputData, getStepResult }) => {
		const { puuid } = getStepResult(fetchAccount);
		const extractedData = extractPlayerDataForAI_V4(inputData, puuid);

		const result = await valorantCoachiKnowledgeAgent.generate(`
            以下のJSONデータは、プレイヤー "${extractedData?.playerSummary?.name}#${extractedData?.playerSummary?.tag}" の特定の試合でのパフォーマンス詳細です。
            
            ---
            試合データ（JSON形式）:
            ${JSON.stringify(extractedData)}
            ---
        `);
		const { text } = result;

		const docs: MDocument[] = [
			MDocument.fromJSON(JSON.stringify(extractedData?.playerSummary), {
				type: "player_summary",
				player_puuid: puuid,
				generated_at: new Date().toISOString(),
				...extractedData?.matchMetadata,
			}),
			...(extractedData?.playerRelevantKills?.map((prk) =>
				MDocument.fromJSON(JSON.stringify(prk), {
					type: "player_relevant_kills",
					player_puuid: puuid,
					round: prk?.round,
					generated_at: new Date().toISOString(),
					...extractedData?.matchMetadata,
				}),
			) || []),
			...(extractedData?.playerRounds?.map((pr) =>
				MDocument.fromJSON(JSON.stringify(pr), {
					type: "player_rounds",
					player_puuid: puuid,
					round: pr?.roundNumber,
					generated_at: new Date().toISOString(),
					...extractedData?.matchMetadata,
				}),
			) || []),
			MDocument.fromText(text, {
				type: "player_coaching_advice",
				player_puuid: puuid,
				generated_at: new Date().toISOString(),
				...extractedData?.matchMetadata,
			}),
		].filter(Boolean);

		const chunk = <T>(array: T[], size: number): T[][] => {
			return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
				array.slice(i * size, (i + 1) * size),
			);
		};

		const chunks = await Promise.all(
			docs.map(async (doc) => await doc.chunk({ maxSize: 512 })),
		);

		const allEmbeddings: Embedding[][] = [];
		for (const values of chunk(
			chunks.flat().map((chunk) => chunk.text),
			100,
		)) {
			const { embeddings } = await embedMany({
				model: google.textEmbeddingModel("text-embedding-004"),
				values: values,
			});
			allEmbeddings.push(embeddings);
		}

		await createValorantKnowledgeIndex();
		await valorantKnowledgeStore.upsert({
			indexName: VALORANT_KNOWLEDGE_INDEX,
			vectors: allEmbeddings.flat(),
			metadata: chunks.flat().map((c) => ({ ...c.metadata, text: c.text })),
		});

		return { success: true };
	},
});

const valorantSaveKnowledgeWorkflow = createWorkflow({
	id: "valorant-save-knowledge-workflow",
	description:
		"valorant の直近の試合をベクトル DB に格納する。格納した情報は vectorQueryTool などから別途取得する。 ",
	inputSchema: z.object({
		name: z.string(),
		tag: z.string(),
		platform: PlatformSchema,
		mode: ModeSchema,
		region: RegionSchema,
		size: z.number().min(1).max(10).default(5).describe("取得する試合件数"),
	}),
	outputSchema: z.array(z.object({ success: z.boolean() })),
	steps: [fetchAccount, fetchMatches, saveKnowledge],
})
	.then(fetchAccount)
	.then(fetchMatches)
	.foreach(saveKnowledge);

valorantSaveKnowledgeWorkflow.commit();

export { valorantSaveKnowledgeWorkflow };
