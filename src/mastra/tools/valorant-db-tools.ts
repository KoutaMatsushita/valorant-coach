import { createClient } from "@libsql/client";
import { createTool } from "@mastra/core";
import { and, eq, exists } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { z } from "zod";
import * as schema from "../../db/schema";

const client = createClient({
	// biome-ignore lint/style/noNonNullAssertion: env
	url: process.env.VALORANT_STORE_URL!,
	authToken: process.env.VALORANT_STORE_AUTH_TOKEN,
});

// Database connection
const db = drizzle({
	client,
	schema,
});

// Zod Schemas for database tables
const PlayerInsertSchema = z.object({
	puuid: z.string(),
	gameName: z.string().optional().nullable(),
	tagLine: z.string().optional().nullable(),
});
const PlayerSelectSchema = z.object({
	id: z.number(),
	puuid: z.string(),
	gameName: z.string().nullable(),
	tagLine: z.string().nullable(),
	createdAt: z.date().nullable(),
});

const MatchInsertSchema = z.object({
	id: z.string(),
	mapName: z.string(),
	gameMode: z.string().optional().nullable(),
	matchStartAt: z.date(),
	gameVersion: z.string().optional().nullable(),
});
const MatchSelectSchema = z.object({
	id: z.string(),
	mapName: z.string(),
	gameMode: z.string().nullable(),
	matchStartAt: z.date(),
	gameVersion: z.string().nullable(),
});

const PlayerMatchStatInsertSchema = z.object({
	playerId: z.number(),
	matchId: z.string(),
	agentName: z.string(),
	kills: z.number(),
	deaths: z.number(),
	assists: z.number(),
	combatScore: z.number().optional().nullable(),
	won: z.boolean(),
	etcData: z.any().optional().nullable(),
});
const PlayerMatchStatSelectSchema = z.object({
	id: z.number(),
	playerId: z.number(),
	matchId: z.string(),
	agentName: z.string(),
	kills: z.number(),
	deaths: z.number(),
	assists: z.number(),
	combatScore: z.number().nullable(),
	won: z.boolean(),
	etcData: z.any().nullable(),
});

const MatchRoundInsertSchema = z.object({
	matchId: z.string(),
	roundNumber: z.number(),
	winningTeam: z.string().optional().nullable(),
	roundResult: z.string().optional().nullable(),
});
const MatchRoundSelectSchema = z.object({
	id: z.number(),
	matchId: z.string(),
	roundNumber: z.number(),
	winningTeam: z.string().nullable(),
	roundResult: z.string().nullable(),
});

// Tools
export const upsertPlayerTool = createTool({
	id: "valorant-db-upsert-player",
	description: "Inserts or updates a player's information.",
	inputSchema: PlayerInsertSchema,
	outputSchema: z.void(),
	execute: async ({ context }) => {
		await db
			.insert(schema.players)
			.values({
				...context,
				createdAt: new Date(),
			})
			.onConflictDoUpdate({
				target: schema.players.puuid,
				set: context,
			});
	},
});

export const getPlayerByNameAndTagTool = createTool({
	id: "valorant-db-get-player-by-name-and-tag",
	description: "Retrieves a player's information by name and tag.",
	inputSchema: z.object({ name: z.string(), tag: z.string() }),
	outputSchema: PlayerSelectSchema.optional(),
	execute: async ({ context }) => {
		return db.query.players.findFirst({
			where: and(
				eq(schema.players.gameName, context.name),
				eq(schema.players.tagLine, context.tag),
			),
		});
	},
});

export const getPlayerByPuuidTool = createTool({
	id: "valorant-db-get-player-by-puuid",
	description: "Retrieves a player's information by their PUUID.",
	inputSchema: z.object({ puuid: z.string() }),
	outputSchema: PlayerSelectSchema.optional(),
	execute: async ({ context }) => {
		return db.query.players.findFirst({
			where: eq(schema.players.puuid, context.puuid),
		});
	},
});

export const upsertMatchTool = createTool({
	id: "valorant-db-upsert-match",
	description: "Inserts or updates a match's information.",
	inputSchema: MatchInsertSchema,
	outputSchema: z.void(),
	execute: async ({ context }) => {
		await db.insert(schema.matches).values(context).onConflictDoUpdate({
			target: schema.matches.id,
			set: context,
		});
	},
});

export const getMatchByIdTool = createTool({
	id: "valorant-db-get-match-by-id",
	description: "Retrieves a match's information by its ID.",
	inputSchema: z.object({ matchId: z.string() }),
	outputSchema: MatchSelectSchema.optional(),
	execute: async ({ context }) => {
		return db.query.matches.findFirst({
			where: eq(schema.matches.id, context.matchId),
		});
	},
});

export const getMatchesByUserIdTool = createTool({
	id: "valorant-db-get-matches-by-user-id",
	description: "Retrieves a match's information by User ID.",
	inputSchema: z.object({ userId: z.number() }),
	outputSchema: z.array(MatchSelectSchema),
	execute: async ({ context }) => {
		return db.query.matches.findMany({
			where: exists(
				db
					.select()
					.from(schema.players)
					.where(eq(schema.players.id, context.userId)),
			),
		});
	},
});

export const upsertPlayerMatchStatTool = createTool({
	id: "valorant-db-upsert-player-match-stat",
	description: "Inserts or updates a player's statistics for a specific match.",
	inputSchema: PlayerMatchStatInsertSchema,
	outputSchema: z.void(),
	execute: async ({ context }) => {
		const value = {
			...context,
			etcData: context.etcData ? JSON.stringify(context.etcData) : null,
		};
		await db
			.insert(schema.playerMatchStats)
			.values(value)
			.onConflictDoUpdate({
				target: [
					schema.playerMatchStats.playerId,
					schema.playerMatchStats.matchId,
				],
				set: value,
			});
	},
});

export const getPlayerMatchStatTool = createTool({
	id: "valorant-db-get-player-match-stat",
	description: "Retrieves a player's statistics for a specific match.",
	inputSchema: z.object({ playerId: z.number(), matchId: z.string() }),
	outputSchema: PlayerMatchStatSelectSchema.optional(),
	execute: async ({ context }) => {
		const result = await db.query.playerMatchStats.findFirst({
			where: and(
				eq(schema.playerMatchStats.playerId, context.playerId),
				eq(schema.playerMatchStats.matchId, context.matchId),
			),
		});
		if (!result) return undefined;
		return {
			...result,
			etcData: result.etcData ? JSON.parse(String(result.etcData)) : undefined,
		};
	},
});

export const upsertMatchRoundTool = createTool({
	id: "valorant-db-upsert-match-round",
	description: "Inserts or updates a match round's information.",
	inputSchema: MatchRoundInsertSchema,
	outputSchema: z.void(),
	execute: async ({ context }) => {
		await db
			.insert(schema.matchRounds)
			.values(context)
			.onConflictDoUpdate({
				target: [schema.matchRounds.matchId, schema.matchRounds.roundNumber],
				set: context,
			});
	},
});

export const getMatchRoundsByMatchIdTool = createTool({
	id: "valorant-db-get-match-rounds-by-match-id",
	description: "Retrieves all rounds for a specific match.",
	inputSchema: z.object({ matchId: z.string() }),
	outputSchema: z.array(MatchRoundSelectSchema),
	execute: async ({ context }) => {
		return db.query.matchRounds.findMany({
			where: eq(schema.matchRounds.matchId, context.matchId),
		});
	},
});
