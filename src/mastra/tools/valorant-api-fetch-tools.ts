import { createTool } from "@mastra/core";
import { z } from "zod";
import {
	ExtractedPlayerDataSchema,
	extractPlayerDataForAI_V4,
} from "../lib/extractPlayerDataForAI_V4";
import {
	AccountSchema,
	ContentSchema,
	EsportsScheduleSchema,
	generateCrosshairImage,
	getAccount,
	getAccountByPuuid,
	getContent,
	getEsportsSchedule,
	getLeaderboardV3,
	getMatch,
	getMatches,
	getMatchesByPuuid,
	getMmrByPuuidV3,
	getMmrHistoryByPuuidV2,
	getMmrHistoryV2,
	getMmrV3,
	getPremierLeaderboard,
	getPremierSeasons,
	getPremierTeam,
	getPremierTeamHistory,
	getQueueStatus,
	getStoreFeaturedV2,
	getStoreOffersV2,
	LeaderboardV3Schema,
	MatchV4Schema,
	MmrHistoryV2Schema,
	MmrV3Schema,
	ModeSchema,
	PartialPremierTeamSchema,
	PlatformSchema,
	PremierConferencesEnum,
	PremierLeaderboardSchema,
	PremierSeasonSchema,
	PremierTeamHistorySchema,
	PremierTeamSchema,
	QueueStatusSchema,
	RegionSchema,
	SeasonsEnum,
	StoreFeaturedV2Schema,
	StoreOffersV2Schema,
	searchPremierTeams,
} from "../lib/valorant-api";

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

export const getValorantMatchesTool = createTool({
	id: "valorant-get-matches-tool",
	description: "Get Valorant matches",
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
	execute: async ({
		context: { name, tag, region, platform, mode, size, start },
	}) => {
		return getMatches(name, tag, region, platform, mode, size, start);
	},
});

export const getValorantMatchesByPuuidTool = createTool({
	id: "valorant-get-matches-by-puuid-tool",
	description: "Get Valorant matches by PUUID.",
	inputSchema: z.object({
		puuid: z.string().describe("valorant puuid"),
		region: RegionSchema,
		platform: PlatformSchema,
		mode: ModeSchema.optional(),
		size: z.number().min(1).max(10).optional(),
		start: z.number().min(1).optional(),
	}),
	outputSchema: z.array(MatchV4Schema),
	execute: async ({
		context: { puuid, region, platform, mode, size, start },
	}) => {
		return getMatchesByPuuid(puuid, region, platform, mode, size, start);
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

export const getValorantMatchTool = createTool({
	id: "valorant-get-match-by-id",
	description: "Get Valorant match summary by id.",
	inputSchema: z.object({
		matchId: z.string(),
		region: RegionSchema,
	}),
	outputSchema: MatchV4Schema,
	execute: async ({ context: { matchId, region } }) => {
		return getMatch(matchId, region);
	},
});

export const getValorantMmrV3Tool = createTool({
	id: "valorant-get-mmr-v3",
	description: "Get MMR details for a player (v3)",
	inputSchema: z.object({
		name: z.string(),
		tag: z.string(),
		region: RegionSchema,
		platform: PlatformSchema,
	}),
	outputSchema: MmrV3Schema,
	execute: async ({ context: { name, tag, region, platform } }) => {
		return getMmrV3(name, tag, region, platform);
	},
});

export const getValorantMmrByPuuidV3Tool = createTool({
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

export const getValorantMmrHistoryV2Tool = createTool({
	id: "valorant-get-mmr-history-v2",
	description: "Get MMR history for a player (v2).",
	inputSchema: z.object({
		name: z.string(),
		tag: z.string(),
		region: RegionSchema,
		platform: PlatformSchema,
	}),
	outputSchema: MmrHistoryV2Schema,
	execute: async ({ context: { name, tag, region, platform } }) => {
		return getMmrHistoryV2(name, tag, region, platform);
	},
});

export const getValorantMmrHistoryByPuuidV2Tool = createTool({
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

export const getValorantLeaderboardV3Tool = createTool({
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

export const getValorantPremierTeamTool = createTool({
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

export const getValorantPremierTeamHistoryTool = createTool({
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

export const searchValorantPremierTeamsTool = createTool({
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

export const getValorantPremierLeaderboardTool = createTool({
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

export const getValorantPremierSeasonsTool = createTool({
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

export const getValorantStoreFeaturedV2Tool = createTool({
	id: "valorant-get-store-featured-v2",
	description: "Get current featured store bundles (v2).",
	inputSchema: z.object({}),
	outputSchema: StoreFeaturedV2Schema,
	execute: async () => {
		return getStoreFeaturedV2();
	},
});

export const getValorantStoreOffersV2Tool = createTool({
	id: "valorant-get-store-offers-v2",
	description: "Get current store offers (v2).",
	inputSchema: z.object({}),
	outputSchema: StoreOffersV2Schema,
	execute: async () => {
		return getStoreOffersV2();
	},
});

export const getValorantEsportsScheduleTool = createTool({
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

export const getValorantQueueStatusTool = createTool({
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

export const generateValorantCrosshairImageTool = createTool({
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

export const getValorantContentTool = createTool({
	id: "valorant-content",
	description: "Get Valorant basic content data like season id's or skins.",
	inputSchema: z.object({
		locale: z.string().default("ja-JP").describe("user locale"),
	}),
	outputSchema: ContentSchema,
	execute: async ({ context: { locale } }) => {
		console.log(await getContent(locale));
		return getContent(locale);
	},
});
