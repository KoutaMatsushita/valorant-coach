import { mastra } from "../mastra";
import { valorantSaveKnowledgeWorkflow } from "../mastra/workflows/valorant-save-knowledge-workflow";

const agent = mastra.getAgent("valorantCoachiAgent");

// const account = await getAccount("mk2481", "1591")
// const matches = await getValorantV4ByPuuidMatchesRegionPlatformPuuid("ap", "pc", account.puuid, {
//     mode: "competitive",
//     size: 1,
// })
//
// const { text } = await agent.generate(`
//             以下のJSONデータは、プレイヤー "${account.name}#${account.tag}" の特定の試合でのパフォーマンス詳細です。
//
//             ---
//             試合データ（JSON形式）:
//             ${JSON.stringify(matches)}
//             ---
//             `
// )
//
// console.log(text)

const workflow = await valorantSaveKnowledgeWorkflow.createRunAsync();
await workflow.start({
	inputData: {
		name: "mk2481",
		tag: "1591",
		mode: "competitive",
		platform: "pc",
		region: "ap",
	},
});
