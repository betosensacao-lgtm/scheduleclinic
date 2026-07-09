/**
 * Persistência de sessão para o LangGraph.
 *
 * Usa SqliteSaver para persistir sessões em disco.
 * As sessões sobrevivem a reinícios do servidor.
 *
 * Uso:
 *   import { getCheckpointer, getConfig } from "@/lib/langgraph/persistence";
 *   const result = await graph.invoke(input, getConfig("session-id"));
 */
import { BaseCheckpointSaver } from "@langchain/langgraph";
import path from "path";
import fs from "fs";
import type { RunnableConfig } from "@langchain/core/runnables";

let _checkpointer: BaseCheckpointSaver | null = null;

export function getCheckpointer(): BaseCheckpointSaver {
  if (!_checkpointer) {
    try {
      const { SqliteSaver } = require("@langchain/langgraph-checkpoint-sqlite");
      const dbDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      const dbPath = path.join(dbDir, "langgraph.db");
      _checkpointer = SqliteSaver.fromConnString(dbPath);
      console.log(`[Persistence] SqliteSaver conectado: ${dbPath}`);
    } catch (error) {
      console.warn("[Persistence] Erro ao inicializar SqliteSaver, usando MemorySaver:", error);
      const { MemorySaver } = require("@langchain/langgraph");
      _checkpointer = new MemorySaver();
      console.log("[Persistence] MemorySaver fallback (in-memory)");
    }
  }
  return _checkpointer;
}

export function getConfig(threadId: string) {
  return {
    configurable: {
      thread_id: threadId,
    },
  } satisfies RunnableConfig;
}
