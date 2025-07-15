import { relations } from "drizzle-orm";
import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { matches } from "./matches";
import { players } from "./players";

// プレイヤーの試合ごとの詳細な戦績を記録するテーブル
// このAIコーチの分析における中核となるテーブルです。
export const playerMatchStats = sqliteTable(
	"player_match_stats",
	{
		id: integer("id").primaryKey(),
		playerId: integer("player_id")
			.notNull()
			.references(() => players.id), // playersテーブルへの参照
		matchId: text("match_id")
			.notNull()
			.references(() => matches.id), // matchesテーブルへの参照
		agentName: text("agent_name").notNull(), // 使用エージェント
		kills: integer("kills").notNull(),
		deaths: integer("deaths").notNull(),
		assists: integer("assists").notNull(),
		combatScore: integer("combat_score"),
		won: integer("won", { mode: "boolean" }).notNull(), // 試合に勝利したか
		etcData: text("etc_data", { mode: "json" }), // ラウンドごとの詳細など、その他の複雑なデータを格納
	},
	(table) => [
		uniqueIndex("player_id_match_id_idx").on(table.playerId, table.matchId),
	],
);

// playerMatchStatsテーブルのリレーション
export const playerMatchStatsRelations = relations(
	playerMatchStats,
	({ one }) => ({
		// 戦績は一人のプレイヤーに属する (多対一)
		player: one(players, {
			fields: [playerMatchStats.playerId],
			references: [players.id],
		}),
		// 戦績は一つの試合に属する (多対一)
		match: one(matches, {
			fields: [playerMatchStats.matchId],
			references: [matches.id],
		}),
	}),
);
