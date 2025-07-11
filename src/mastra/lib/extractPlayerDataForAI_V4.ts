import { z } from "zod";
import type { MatchV4Schema } from "./valorant-api";

const LocationSchema = z
	.object({
		x: z.number().optional(),
		y: z.number().optional(),
	})
	.nullish();

const OverallPlayerStatsSchema = z
	.object({
		score: z.number().optional(),
		kills: z.number().optional(),
		deaths: z.number().optional(),
		assists: z.number().optional(),
		headshots: z.number().optional(),
		legshots: z.number().optional(),
		bodyshots: z.number().optional(),
		damage: z
			.object({
				dealt: z.number().optional(),
				received: z.number().optional(),
			})
			.optional(),
	})
	.nullish();

// Corrected: Two different schemas for economy.
const OverallEconomySchema = z
	.object({
		spent: z
			.object({
				overall: z.number().optional(),
				average: z.number().optional(),
			})
			.optional(),
		loadout_value: z
			.object({
				overall: z.number().optional(),
				average: z.number().optional(),
			})
			.optional(),
	})
	.nullish();

// Corrected: One unified schema for ability casts, as the structure is identical in the V4 API.
const AbilityCastsSchema = z
	.object({
		grenade: z.number().nullish(),
		ability_1: z.number().nullish(),
		ability_2: z.number().nullish(),
		ultimate: z.number().nullish(),
	})
	.optional();

const BehaviorSchema = z
	.object({
		afk_rounds: z.number().optional(),
		friendly_fire: z
			.object({
				incoming: z.number().optional(),
				outgoing: z.number().optional(),
			})
			.optional(),
		rounds_in_spawn: z.number().optional(),
	})
	.nullish();

// Schema for individual rounds in the extracted data
const PlayerRoundSchema = z.object({
	roundId: z.number().nullish(),
	roundNumber: z.number(),
	result: z.string().nullish(),
	winningTeam: z.string().nullish(),
	bombPlanted: z.boolean(),
	bombDefused: z.boolean(),
	plantSite: z.string().nullish(),
	plantPlayer: z.string().nullish(),
	defusePlayer: z.string().nullish(),
	roundEconomy: z
		.object({
			loadout_value: z.number().optional(),
			remaining: z.number().optional(),
			weapon: z
				.object({
					id: z.string().nullish(),
					name: z.string().nullish(),
					type: z.string().nullish(),
				})
				.nullish(),
			armor: z
				.object({
					id: z.string().uuid().nullish(),
					name: z.string().nullish(),
				})
				.nullish(),
		})
		.nullish(),
	roundStats: z
		.object({
			bodyshots: z.number().optional(),
			headshots: z.number().optional(),
			legshots: z.number().optional(),
			damage: z.number().optional(),
			kills: z.number().optional(),
			assists: z.number().optional(),
			score: z.number().optional(),
		})
		.optional(),
	roundAbilityCasts: z
		.object({
			grenade: z.number().nullish(),
			ability_1: z.number().nullish(),
			ability_2: z.number().nullish(),
			ultimate: z.number().nullish(),
		})
		.optional(),
});

// Schema for kill events relevant to the player
const PlayerRelevantKillSchema = z.object({
	round: z.number().optional(),
	timeInRoundMs: z.number().optional(),
	killerName: z.string().nullish(),
	killerTag: z.string().nullish(),
	victimName: z.string().nullish(),
	victimTag: z.string().nullish(),
	weapon: z.string().nullish(),
	location: LocationSchema,
});

// Main schema for the entire extracted player data object
export const ExtractedPlayerDataSchema = z
	.object({
		matchMetadata: z.object({
			matchId: z.string().optional(),
			mapName: z.string().optional(),
			queueName: z.string().nullish(),
			startedAt: z.string().optional(),
			gameLengthMs: z.number().optional(),
			isCompleted: z.boolean().optional(),
			winningTeam: z.string().optional(),
			roundsPlayed: z.number().optional(),
		}),
		playerSummary: z.object({
			puuid: z.string().optional(),
			name: z.string().optional(),
			tag: z.string().optional(),
			teamId: z.string().optional(),
			agentName: z.string().nullish(),
			tierName: z.string().nullish(),
			overallStats: OverallPlayerStatsSchema,
			overallEconomy: OverallEconomySchema,
			overallAbilityCasts: AbilityCastsSchema, // Use the unified schema
			behavior: BehaviorSchema,
		}),
		playerRounds: z.array(PlayerRoundSchema).nullish(),
		playerRelevantKills: z.array(PlayerRelevantKillSchema).optional(),
	})
	.nullable();

export type ExtractedPlayerData = z.infer<typeof ExtractedPlayerDataSchema>;

export const extractPlayerDataForAI_V4 = (
	match: z.infer<typeof MatchV4Schema>,
	targetPuuid: string,
): ExtractedPlayerData => {
	// プレイヤー全体の情報を取得
	const player = match?.players?.find((p) => p.puuid === targetPuuid);
	if (!player) return null;

	// 各ラウンドにおける対象プレイヤーの統計を抽出
	const playerRounds =
		match?.rounds
			?.map((round, index) => {
				const playerRoundStats = round.stats?.find(
					(ps) => ps.player?.puuid === targetPuuid,
				);
				if (!playerRoundStats) return null; // このラウンドでプレイヤーの統計がない場合

				return PlayerRoundSchema.parse({
					roundId: round.id, // v4 では id がある
					roundNumber: index + 1,
					result: round.result, // 勝敗結果
					winningTeam: round.winning_team,
					bombPlanted: !!round.plant,
					bombDefused: !!round.defuse,
					plantSite: round.plant?.site,
					plantPlayer: round.plant?.player?.name,
					defusePlayer: round.defuse?.player?.name,
					roundEconomy: playerRoundStats.economy, // ラウンド内のエコノミー
					roundStats: playerRoundStats.stats, // ラウンド内のキル、デス、ダメージなど
					roundAbilityCasts: playerRoundStats.ability_casts, // ラウンド内のアビリティ使用
				});
			})
			.filter((value): value is z.infer<typeof PlayerRoundSchema> => !!value) ??
		[];

	// 試合全体のキルイベントから、対象プレイヤーが関与したものを抽出
	const playerRelevantKills =
		match.kills
			?.filter(
				(kill) =>
					kill.killer?.puuid === targetPuuid ||
					kill.victim?.puuid === targetPuuid,
			)
			.map((kill) => ({
				round: kill.round,
				timeInRoundMs: kill.time_in_round_in_ms,
				killerName: kill.killer?.name,
				killerTag: kill.killer?.tag,
				victimName: kill.victim?.name,
				victimTag: kill.victim?.tag,
				weapon: kill.weapon?.name,
				location: kill.location,
			})) ?? [];

	return {
		matchMetadata: {
			matchId: match?.metadata?.match_id,
			mapName: match?.metadata?.map?.name,
			queueName: match?.metadata?.queue?.name,
			startedAt: match?.metadata?.started_at,
			gameLengthMs: match?.metadata?.game_length_in_ms,
			isCompleted: match?.metadata?.is_completed,
			winningTeam: match?.teams?.find((t) => t.won)?.team_id, // 勝利チームID
			roundsPlayed: match.rounds?.length,
		},
		playerSummary: {
			puuid: player.puuid,
			name: player.name,
			tag: player.tag,
			teamId: player.team_id,
			agentName: player.agent?.name,
			tierName: player.tier?.name,
			// 試合全体統計
			overallStats: player.stats,
			overallEconomy: player.economy,
			overallAbilityCasts: player.ability_casts,
			behavior: player.behavior,
		},
		playerRounds: playerRounds,
		playerRelevantKills: playerRelevantKills, // 試合全体のキルイベント
	};
};
