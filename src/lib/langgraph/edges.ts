import type { ChatStateType } from "./state";

export type NodeName =
  | "router"
  | "doubt_resolution"
  | "scheduling"
  | "pre_anamnesis"
  | "__end__";

export function routeAfterRouter(state: ChatStateType): NodeName {
  switch (state.intent) {
    case "DUVIDA":
      return "doubt_resolution";
    case "AGENDAMENTO":
    case "CANCELAMENTO":
      return "scheduling";
    case "PRE_ANAMNESE":
      return "pre_anamnesis";
    default:
      return "__end__";
  }
}

export function routeAfterDoubt(state: ChatStateType): NodeName {
  return "__end__";
}

export function routeAfterScheduling(state: ChatStateType): NodeName {
  return "__end__";
}

export function routeAfterPreAnamnesis(state: ChatStateType): NodeName {
  return "__end__";
}
