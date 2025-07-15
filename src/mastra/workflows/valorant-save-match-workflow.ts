import { createStep, createWorkflow } from "@mastra/core";
import { RuntimeContext } from "@mastra/core/di";
import { z } from "zod";
import {
	MatchV4Schema,
	ModeSchema,
	PlatformSchema,
	RegionSchema,
} from "../lib/valorant-api";
import {
	getValorantAccountTool,
	getValorantMatchesTool,
} from "../tools/valorant-api-fetch-tools";
import {
	getPlayerByNameAndTagTool,
	upsertMatchRoundTool,
	upsertMatchTool,
	upsertPlayerMatchStatTool,
	upsertPlayerTool,
} from "../tools/valorant-db-tools";

const valorantDBUpsertMatchStep = createStep({
	id: "valorant-db-upsert-match",
	description: "updates a match's information.",
	inputSchema: MatchV4Schema,
	outputSchema: z.boolean(),
	execute: async ({ inputData, getInitData }) => {
		const { name, tag } = await getInitData();
		const runtimeContext = new RuntimeContext();

		// TODO: コレ分離したほうが良さそう
		const currentPlayer = await getPlayerByNameAndTagTool.execute({
			context: {
				name,
				tag,
			},
			runtimeContext,
		});

		if (!currentPlayer) throw Error("player not found");
		if (
			!inputData ||
			!inputData?.metadata?.match_id ||
			!inputData?.metadata?.map?.name ||
			!inputData?.metadata?.queue?.id ||
			!inputData?.metadata?.started_at ||
			!inputData?.metadata?.game_version ||
			!inputData?.rounds ||
			!inputData?.players
		)
			throw Error("invalid data");

		await upsertMatchTool.execute({
			context: {
				id: inputData.metadata.match_id,
				mapName: inputData.metadata.map.name,
				gameMode: inputData.metadata.queue.id,
				matchStartAt: new Date(inputData.metadata.started_at),
				gameVersion: inputData.metadata.game_version,
			},
			runtimeContext,
		});

		for (const [index, round] of inputData.rounds.entries()) {
			await upsertMatchRoundTool.execute({
				context: {
					matchId: inputData.metadata.match_id,
					roundNumber: index + 1,
					winningTeam: round.winning_team,
					roundResult: round.result,
				},
				runtimeContext,
			});
		}

		const currentPlayerMatchStat = inputData.players.filter(
			(p) => p.puuid === currentPlayer.puuid,
		);

		for (const player of currentPlayerMatchStat) {
			await upsertPlayerMatchStatTool.execute({
				context: {
					playerId: currentPlayer.id,
					matchId: inputData.metadata.match_id,
					agentName: player.agent?.name ?? "",
					kills: player.stats?.kills ?? 0,
					deaths: player.stats?.deaths ?? 0,
					assists: player.stats?.assists ?? 0,
					combatScore: player.stats?.score ?? 0,
					won:
						inputData.teams?.find((team) => team.team_id === player.team_id)
							?.won ?? false,
					etcData: {
						kill: inputData?.kills
							?.filter((kill) => kill?.killer?.puuid === player.puuid)
							?.filter(Boolean),
					},
				},
				runtimeContext,
			});
		}

		return true;
	},
});

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
