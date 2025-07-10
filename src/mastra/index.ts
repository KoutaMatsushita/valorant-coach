import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { valorantCoachiAgent } from "./agents/valorant-coachi-agent";
import { valorantSaveKnowledgeWorkflow } from "./workflows/valorant-save-knowledge-workflow";
import { valorantKnowledgeStore } from "./stores/valorantKnowledgeStore";

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
