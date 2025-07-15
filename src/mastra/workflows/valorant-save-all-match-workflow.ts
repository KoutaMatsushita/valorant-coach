import { setTimeout } from "node:timers/promises";
import { createStep, createWorkflow } from "@mastra/core";
import { RuntimeContext } from "@mastra/core/di";
import { z } from "zod";
import {
	MatchV4Schema,
	ModeSchema,
	PlatformSchema,
	RegionSchema,
} from "../lib/valorant-api";
import { valorantDBUpsertMatchStep } from "../steps/valorant-db-steps";
import {
	getValorantAccountTool,
	getValorantMatchesTool,
} from "../tools/valorant-api-fetch-tools";
import { upsertPlayerTool } from "../tools/valorant-db-tools";

const fetchAllMatchTool = createStep({
	id: "fetch-all-match",
	description: "fetch all match",
	inputSchema: z.object({
		name: z.string(),
		tag: z.string(),
		region: RegionSchema,
		platform: PlatformSchema,
		mode: ModeSchema.optional(),
		size: z.number().min(1).max(10).default(1).optional(),
		start: z.number().min(0).default(0).optional(),
	}),
	outputSchema: z.array(MatchV4Schema),
	execute: async ({ inputData }) => {
		const runtimeContext = new RuntimeContext();
		const allMatches: z.infer<typeof MatchV4Schema>[] = [];

		let loop = true;
		let start = inputData.start ?? 0;

		do {
			const matches = await getValorantMatchesTool.execute({
				context: { ...inputData, start },
				runtimeContext,
			});
			allMatches.push(...matches);
			start += matches.length;
			loop = matches.length > 0;
			await setTimeout(5000); // API が 30/min なので余裕を持った待ち時間とする
		} while (loop);

		return allMatches;
	},
});

const valorantSaveAllMatchWorkflow = createWorkflow({
	id: "valorant-save-all-match-workflow",
	description: "valorant のすべての試合を DB に格納する。",
	inputSchema: z.object({
		name: z.string(),
		tag: z.string(),
		region: RegionSchema,
		platform: PlatformSchema,
		mode: ModeSchema.optional(),
	}),
	outputSchema: z.boolean(),
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
	.then(fetchAllMatchTool)
	.foreach(valorantDBUpsertMatchStep)
	.map(async ({ inputData, getInitData }) => {
		const { size } = await getInitData();
		return {
			request_size: size,
			process_size: inputData.length,
		};
	});

valorantSaveAllMatchWorkflow.commit();

export { valorantSaveAllMatchWorkflow };
