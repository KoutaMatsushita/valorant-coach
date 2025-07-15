import { GoogleGenAI } from "@google/genai";
import { createTool } from "@mastra/core";
import { z } from "zod";

const ai = new GoogleGenAI({
	apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const ANALYSIS_PROMPT = `
# 命令書

あなたは、VALORANTの試合を分析する、高精度のデータ抽出AIです。
あなたの唯一の使命は、指定されたYouTube動画を視聴し、試合中に発生した客観的な出来事（イベント）を、指定されたJSON形式で正確にタイムスタンプと共にリストアップすることです。

## 禁止事項
* コーチングやアドバイスの提供: 「もっとこうすべきだった」といった提案や改善点は一切含めないでください。
* 感想や主観的な評価: 「素晴らしいプレイ」「もったいないミス」といった感想や評価は一切含めないでください。
* 不確かな情報の推測: 動画から明確に読み取れない情報は「null」として出力し、決して推測しないでください。

## 抽出するべき情報
動画のプレイヤー視点で、以下の情報を各ラウンドについて抽出してください。
* ラウンド情報: ラウンド番号、攻守（攻撃/防衛）、ラウンドの種類（ピストル、エコ、バイなど）
* 主要イベント:
    * プレイヤーのキル
    * プレイヤーのデス
    * スパイクの設置・解除
    * アルティメットアビリティの使用
* イベント詳細:
    * イベント発生時のタイムスタンプ（例: "1:24"）
    * イベント発生時のプレイヤーの場所（例: "アセント Aヘブン"）
    * キル/デス時の使用武器や相手

## 出力形式
必ず以下のJSONスキーマに従って、構造化されたデータとして出力してください。

\`\`\`json
{
  "map": "マップ名 or null",
  "agent": "プレイヤーの使用エージェント or null",
  "finalScore": "最終スコア or null",
  "rounds": [
    {
      "roundNumber": 1,
      "side": "Attack",
      "roundType": "Pistol",
      "events": [
        {
          "timestamp": "0:45",
          "eventType": "KILL",
          "description": "シェリフを使用し、Bメインで敵のジェットをキル。"
        },
        {
          "timestamp": "1:12",
          "eventType": "DEATH",
          "description": "Bサイト内で敵のサイファーにキルされる。"
        }
      ]
    },
    {
      "roundNumber": 2,
      "side": "Attack",
      "roundType": "Eco",
      "events": [
        {
            "timestamp": "2:30",
            "eventType": "ULTIMATE_USE",
            "description": "ブレードストームを使用。"
        }
      ]
    }
  ]
}
\`\`\`

# 依頼
以下のYouTube動画を分析し、上記の形式で出力してください。
`;

export const valorantVideoAnalyzerTool = createTool({
	id: "valorant-video-analyzer",
	description:
		"Valorantの試合動画を解析し、客観的なイベントデータをJSON形式で抽出する",
	inputSchema: z.object({
		url: z.string().url().describe("分析したいYouTubeの動画リンク"),
	}),
	outputSchema: z
		.string()
		.nullish()
		.describe("イベントデータが含まれたJSON文字列"),
	execute: async ({ context: { url } }) => {
		const result = await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: [
				{
					text: ANALYSIS_PROMPT,
				},
				{
					fileData: {
						fileUri: url,
					},
				},
			],
		});

		return result.text;
	},
});

export const webSearchTool = createTool({
	id: "web-search-analyzer",
	description: "URL や検索ワードを元に Google 検索を行う",
	inputSchema: z.object({
		word: z.string().describe("Google 検索に使う検索ワード"),
	}),
	outputSchema: z.string().nullish().describe("検索結果"),
	execute: async ({ context: { word } }) => {
		const result = await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: [
				{
					text: word,
				},
			],
			config: {
				tools: [{ urlContext: {} }, { googleSearch: {} }],
			},
		});

		return result.text;
	},
});
