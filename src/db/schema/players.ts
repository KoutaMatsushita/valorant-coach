import { relations } from "drizzle-orm";
import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { playerMatchStats } from "./playerMatchStats";

// プレイヤー情報を管理するテーブル
// AIコーチの利用者を記録します。
export const players = sqliteTable(
	"players",
	{
		id: integer("id").primaryKey(), // システム内部で使う連番ID
		puuid: text("puuid").notNull().unique(), // Riot APIから取得するプレイヤー固有ID
		gameName: text("game_name"), // Valorantでの表示名
		tagLine: text("tag_line"), // Valorantのタグライン
		createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(), // 登録日時
	},
	(table) => [
		uniqueIndex("game_name_tag_line_idx").on(table.gameName, table.tagLine),
	],
);

// playersテーブルのリレーション
export const playersRelations = relations(players, ({ many }) => ({
	// プレイヤーは多数の試合戦績を持つ (一対多)
	matchStats: many(playerMatchStats),
}));
