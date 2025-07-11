import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { PinoLogger } from "@mastra/loggers";
import { valorantCoachiAgent } from "./agents/valorant-coachi-agent";
import { valorantKnowledgeStore } from "./stores/valorantKnowledgeStore";
import { valorantSaveKnowledgeWorkflow } from "./workflows/valorant-save-knowledge-workflow";

export const mastra = new Mastra({
	workflows: { valorantKnowledgeWorkflow: valorantSaveKnowledgeWorkflow },
	agents: { valorantCoachiAgent },
	storage: new LibSQLStore({
		// stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
		url: "file:../mastra.db",
	}),
	vectors: { LibSQLVector: valorantKnowledgeStore },
	logger: new PinoLogger({
		name: "Mastra",
		level: "info",
	}),
});
