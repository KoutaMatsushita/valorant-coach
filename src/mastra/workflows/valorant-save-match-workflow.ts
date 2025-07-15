import { createStep, createWorkflow } from "@mastra/core";
import { z } from "zod";
import { ModeSchema, PlatformSchema, RegionSchema } from "../lib/valorant-api";
import { valorantDBUpsertMatchStep } from "../steps/valorant-db-steps";
import {
	getValorantAccountTool,
	getValorantMatchesTool,
} from "../tools/valorant-api-fetch-tools";
import { upsertPlayerTool } from "../tools/valorant-db-tools";

const valorantSaveMatchWorkflow = createWorkflow({
	id: "valorant-save-match-workflow",
	description: "valorant の直近の試合を DB に格納する。",
	inputSchema: z.object({
		name: z.string(),
		tag: z.string(),
		region: RegionSchema,
		platform: PlatformSchema,
		mode: ModeSchema.optional(),
		size: z
			.number()
			.min(1)
			.max(10)
			.default(1)
			.optional()
			.describe(
				"AI から呼ばれる場合、可能な限り少ない数字を指定することを推奨する。トークンエラーしちゃうので。",
			),
		start: z.number().min(0).default(0).optional(),
	}),
	outputSchema: z.object({
		request_size: z.number().describe("リクエストされた size をそのまま返す"),
		process_size: z.number().describe("実際に保存された件数を返す"),
	}),
})
	.map(async ({ inputData: { name, tag } }) => ({ name, tag }))
	.then(createStep(getValorantAccountTool))
	.map(async ({ inputData: { name, tag, puuid } }) => ({
		gameName: name,
		tagLine: tag,
		puuid,
	}))
	.then(createStep(upsertPlayerTool))
	.map(async ({ getInitData }) => {
		return {
			...(await getInitData()),
		};
	})
	.then(createStep(getValorantMatchesTool))
	.foreach(valorantDBUpsertMatchStep)
	.map(async ({ inputData, getInitData }) => {
		const { size } = await getInitData();
		return {
			request_size: size,
			process_size: inputData.length,
		};
	});

valorantSaveMatchWorkflow.commit();

export { valorantSaveMatchWorkflow };
