import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { matchRounds } from "./matchRounds";
import { playerMatchStats } from "./playerMatchStats";

// 試合の基本情報を管理するテーブル
// 1試合単位のサマリーデータを記録します。
export const matches = sqliteTable("matches", {
	id: text("id").primaryKey(), // Riot APIから取得する試合固有ID
	mapName: text("map_name").notNull(), // マップ名
	gameMode: text("game_mode"), // ゲームモード
	matchStartAt: integer("match_start_at", { mode: "timestamp" }).notNull(), // 試合開始日時
	gameVersion: text("game_version"), // パッチバージョン
});

// matchesテーブルのリレーション
export const matchesRelations = relations(matches, ({ many }) => ({
	// 試合には多数のプレイヤー戦績が含まれる (一対多)
	playerStats: many(playerMatchStats),
	// 試合には多数のラウンドが含まれる (一対多)
	rounds: many(matchRounds),
}));
