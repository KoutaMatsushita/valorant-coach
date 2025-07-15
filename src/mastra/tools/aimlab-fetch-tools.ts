import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
	getPlaysAgg,
	getUserInfo,
	UserInfoSchema,
	UserPlaysAggSchema,
} from "../lib/aimlab-api";

export const getAimlabProfileTool = createTool({
	id: "aimlab-get-profile",
	description: "Get profile for aimlab player profile by username.",
	inputSchema: z.object({
		username: z.string().describe("aimlab username"),
	}),
	outputSchema: UserInfoSchema,
	execute: async ({ context: { username } }) => {
		return await getUserInfo(username);
	},
});

export const getAimlabPlaysAggTool = createTool({
	id: "aimlab-get-plays-agg",
	description: "Get aimalb play histories for user.",
	inputSchema: z.object({
		userId: z.string().describe("aimlab id"),
	}),
	outputSchema: UserPlaysAggSchema,
	execute: async ({ context: { userId } }) => {
		return await getPlaysAgg(userId);
	},
});
