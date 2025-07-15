import { relations } from "drizzle-orm";
import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { matches } from "./matches";

// 試合のラウンドごとの結果を記録するテーブル
// ピストルラウンドの勝率分析などに利用します。
export const matchRounds = sqliteTable(
	"match_rounds",
	{
		id: integer("id").primaryKey(),
		matchId: text("match_id")
			.notNull()
			.references(() => matches.id), // matchesテーブルへの参照
		roundNumber: integer("round_number").notNull(), // ラウンド番号
		winningTeam: text("winning_team"), // "Red" or "Blue"
		roundResult: text("round_result"), // "Elimination", "Detonated", etc.
	},
	(table) => [
		index("match_id_idx").on(table.matchId),
		uniqueIndex("match_id_round_number_idx").on(
			table.matchId,
			table.roundNumber,
		),
	],
);

// matchRoundsテーブルのリレーション
export const matchRoundsRelations = relations(matchRounds, ({ one }) => ({
	// ラウンドは一つの試合に属する (多対一)
	match: one(matches, {
		fields: [matchRounds.matchId],
		references: [matches.id],
	}),
}));
