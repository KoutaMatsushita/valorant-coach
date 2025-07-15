import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { valorantCoachAgent } from "./agents/valorant-coach-agent";
import { valorantResearchAgent } from "./agents/valorant-research-agent";
import { valorantKnowledgeVectorStore } from "./stores/valorantKnowledgeVectorStore";
import { valorantStore } from "./stores/valorantStore";
import { valorantSaveKnowledgeWorkflow } from "./workflows/valorant-save-knowledge-workflow";
import { valorantSaveMatchWorkflow } from "./workflows/valorant-save-match-workflow";
import {valorantSaveAllMatchWorkflow} from "./workflows/valorant-save-all-match-workflow";

export const mastra = new Mastra({
	workflows: { valorantSaveKnowledgeWorkflow, valorantSaveMatchWorkflow, valorantSaveAllMatchWorkflow },
	agents: { valorantCoachAgent, valorantResearchAgent },
	storage: valorantStore,
	vectors: { valorantKnowledgeVectorStore },
	logger: new PinoLogger({
		name: "Mastra",
		level: "info",
	}),
});
