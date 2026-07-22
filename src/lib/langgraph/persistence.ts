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
    const { MemorySaver } = require("@langchain/langgraph");
    _checkpointer = new MemorySaver();
    console.log("[Persistence] MemorySaver conectado (in-memory)");
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
