import { createStep } from "@mastra/core";
import { RuntimeContext } from "@mastra/core/di";
import { z } from "zod";
import { MatchV4Schema } from "../lib/valorant-api";
import {
	getPlayerByNameAndTagTool,
	upsertMatchRoundTool,
	upsertMatchTool,
	upsertPlayerMatchStatTool,
} from "../tools/valorant-db-tools";

export const valorantDBUpsertMatchStep = createStep({
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
