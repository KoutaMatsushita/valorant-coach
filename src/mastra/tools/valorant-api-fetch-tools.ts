import { z } from "zod";
import {
	AccountSchema,
	getAccount,
	getAccountByPuuid,
	getLeaderboardV3,
	getMatch,
	getMatchesByPuuid,
	getMmrByPuuidV3,
	getMmrHistoryByPuuidV2,
	LeaderboardV3Schema,
	ModeSchema,
	MmrHistoryV2Schema,
	MmrV3Schema,
	PlatformSchema,
	RegionSchema,
	SeasonsEnum,
	getQueueStatus,
	QueueStatusSchema,
	EsportsScheduleSchema,
	getEsportsSchedule,
	getStoreOffersV2,
	StoreOffersV2Schema,
	getStoreFeaturedV2,
	StoreFeaturedV2Schema,
	getPremierSeasons,
	PremierSeasonSchema,
	getPremierLeaderboard,
	PremierLeaderboardSchema,
	PremierConferencesEnum,
	PartialPremierTeamSchema,
	searchPremierTeams,
	getPremierTeamHistory,
	PremierTeamHistorySchema,
	getPremierTeam,
	PremierTeamSchema,
	generateCrosshairImage,
} from "../lib/valorant-api";
import {
	ExtractedPlayerDataSchema,
	extractPlayerDataForAI_V4,
} from "../lib/extractPlayerDataForAI_V4";
import { createTool } from "@mastra/core";

// Account Endpoints
export const getValorantAccountTool = createTool({
	id: "valorant-get-account",
	description: "Get Valorant account details by Riot ID (name and tag).",
	inputSchema: z.object({
		name: z.string().describe("valorant user name"),
		tag: z.string().describe("valorant user tag"),
	}),
	outputSchema: AccountSchema,
	execute: async ({ context: { name, tag } }) => {
		return getAccount(name, tag);
	},
});

export const getValorantAccountByPuuidTool = createTool({
	id: "valorant-get-account-by-puuid",
	description: "Get Valorant account details by PUUID.",
	inputSchema: z.object({
		puuid: z.string().describe("valorant puuid"),
	}),
	outputSchema: AccountSchema,
	execute: async ({ context: { puuid } }) => {
		return getAccountByPuuid(puuid);
	},
});

export const getValorantMatchIdsByPuuidTool = createTool({
	id: "valorant-get-match-ids-by-puuid",
	description: "Get Valorant match ids by PUUID.",
	inputSchema: z.object({
		puuid: z.string().describe("valorant puuid"),
		region: RegionSchema,
		platform: PlatformSchema,
		mode: ModeSchema.optional(),
		size: z.number().min(1).max(10).optional(),
	}),
	outputSchema: z.array(z.string()),
	execute: async ({ context: { puuid, region, platform, mode, size } }) => {
		return getMatchesByPuuid(puuid, region, platform, mode, size).then(
			(matches) =>
				matches
					.map((m) => m.metadata?.match_id)
					.filter((v): v is string => !!v),
		);
	},
});

export const getValorantMatchSummaryTool = createTool({
	id: "valorant-get-match-summary-by-id",
	description: "Get Valorant match summary by id.",
	inputSchema: z.object({
		puuid: z.string(),
		matchId: z.string(),
		region: RegionSchema,
	}),
	outputSchema: ExtractedPlayerDataSchema,
	execute: async ({ context: { puuid, matchId, region } }) => {
		return extractPlayerDataForAI_V4(await getMatch(matchId, region), puuid);
	},
});

export const getMmrByPuuidV3Tool = createTool({
	id: "valorant-get-mmr-by-puuid-v3",
	description: "Get MMR details for a player by PUUID (v3).",
	inputSchema: z.object({
		puuid: z.string(),
		region: RegionSchema,
		platform: PlatformSchema,
	}),
	outputSchema: MmrV3Schema,
	execute: async ({ context: { puuid, region, platform } }) => {
		return getMmrByPuuidV3(puuid, region, platform);
	},
});

export const getMmrHistoryByPuuidV2Tool = createTool({
	id: "valorant-get-mmr-history-by-puuid-v2",
	description: "Get MMR history for a player by PUUID (v2).",
	inputSchema: z.object({
		puuid: z.string(),
		region: RegionSchema,
		platform: PlatformSchema,
	}),
	outputSchema: MmrHistoryV2Schema,
	execute: async ({ context: { puuid, region, platform } }) => {
		return getMmrHistoryByPuuidV2(puuid, region, platform);
	},
});

export const getLeaderboardV3Tool = createTool({
	id: "valorant-get-leaderboard-v3",
	description:
		"Get the ranked leaderboard for a specific region and season (v3).",
	inputSchema: z.object({
		region: RegionSchema,
		platform: PlatformSchema,
		puuid: z.string().optional(),
		name: z.string().optional(),
		tag: z.string().optional(),
		season_short: SeasonsEnum.optional(),
		season_id: z.string().uuid().optional(),
		size: z.number().min(1).optional(),
		start_index: z.number().min(0).optional(),
	}),
	outputSchema: LeaderboardV3Schema,
	execute: async ({
		context: {
			region,
			platform,
			puuid,
			name,
			tag,
			season_short,
			season_id,
			size,
			start_index,
		},
	}) => {
		return getLeaderboardV3(
			region,
			platform,
			puuid,
			name,
			tag,
			season_short,
			season_id,
			size,
			start_index,
		);
	},
});

export const getPremierTeamTool = createTool({
	id: "valorant-get-premier-team",
	description: "Get details about a premier team.",
	inputSchema: z.object({
		teamId: z.string().uuid(),
	}),
	outputSchema: PremierTeamSchema,
	execute: async ({ context: { teamId } }) => {
		return getPremierTeam(teamId);
	},
});

export const getPremierTeamHistoryTool = createTool({
	id: "valorant-get-premier-team-history",
	description: "Get match history of a premier team.",
	inputSchema: z.object({
		teamId: z.string().uuid(),
	}),
	outputSchema: PremierTeamHistorySchema,
	execute: async ({ context: { teamId } }) => {
		return getPremierTeamHistory(teamId);
	},
});

export const searchPremierTeamsTool = createTool({
	id: "valorant-search-premier-teams",
	description: "Search for current active premier teams.",
	inputSchema: z.object({
		name: z.string().optional(),
		tag: z.string().optional(),
		division: z.number().min(1).max(20).optional(),
		conference: PremierConferencesEnum.optional(),
	}),
	outputSchema: z.array(PartialPremierTeamSchema),
	execute: async ({ context: { name, tag, division, conference } }) => {
		return searchPremierTeams(name, tag, division, conference);
	},
});

export const getPremierLeaderboardTool = createTool({
	id: "valorant-get-premier-leaderboard",
	description:
		"Get a combined leaderboard in the affinity, sorted by div and ranking.",
	inputSchema: z.object({
		region: RegionSchema,
		conference: PremierConferencesEnum.optional(),
		division: z.number().min(1).max(20).optional(),
	}),
	outputSchema: PremierLeaderboardSchema,
	execute: async ({ context: { region, conference, division } }) => {
		return getPremierLeaderboard(region, conference, division);
	},
});

export const getPremierSeasonsTool = createTool({
	id: "valorant-get-premier-seasons",
	description: "Get a list of all premier seasons.",
	inputSchema: z.object({
		region: RegionSchema,
	}),
	outputSchema: z.array(PremierSeasonSchema),
	execute: async ({ context: { region } }) => {
		return getPremierSeasons(region);
	},
});

export const getStoreFeaturedV2Tool = createTool({
	id: "valorant-get-store-featured-v2",
	description: "Get current featured store bundles (v2).",
	inputSchema: z.object({}),
	outputSchema: StoreFeaturedV2Schema,
	execute: async () => {
		return getStoreFeaturedV2();
	},
});

export const getStoreOffersV2Tool = createTool({
	id: "valorant-get-store-offers-v2",
	description: "Get current store offers (v2).",
	inputSchema: z.object({}),
	outputSchema: StoreOffersV2Schema,
	execute: async () => {
		return getStoreOffersV2();
	},
});

export const getEsportsScheduleTool = createTool({
	id: "valorant-get-esports-schedule",
	description: "Returns esports schedule data.",
	inputSchema: z.object({
		region: z.string().optional(),
		league: z.string().optional(),
	}),
	outputSchema: EsportsScheduleSchema,
	execute: async ({ context: { region, league } }) => {
		return getEsportsSchedule(region, league);
	},
});

export const getQueueStatusTool = createTool({
	id: "valorant-get-queue-status",
	description: "Get a list of all available queues and their metadata.",
	inputSchema: z.object({
		region: RegionSchema,
	}),
	outputSchema: QueueStatusSchema,
	execute: async ({ context: { region } }) => {
		return getQueueStatus(region);
	},
});

export const generateCrosshairImageTool = createTool({
	id: "valorant-generate-crosshair-image",
	description: "Outputs a 1024x1024 pixel image of the requested crosshair.",
	inputSchema: z.object({
		id: z.string().describe("ID of the crosshair"),
	}),
	outputSchema: z.string(), // This will return a URL to the image
	execute: async ({ context: { id } }) => {
		return generateCrosshairImage(id);
	},
});
