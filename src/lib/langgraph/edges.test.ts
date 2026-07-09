import {
  routeAfterRouter,
  routeAfterDoubt,
  routeAfterScheduling,
  routeAfterPreAnamnesis,
} from "@/lib/langgraph/edges";
import { ChatStateType } from "@/lib/langgraph/state";

function makeState(
  overrides: Partial<ChatStateType> = {}
): ChatStateType {
  return {
    messages: [],
    platform: "whatsapp",
    userId: "",
    sessionId: "",
    clinicId: "",
    intent: "NAO_IDENTIFICADO",
    calendarId: "",
    professionalName: "",
    preferredDate: null,
    preferredTime: null,
    eventId: null,
    patientData: { collectionComplete: false },
    clinicContext: "",
    completed: false,
    error: null,
    locale: "pt",
    ...overrides,
  };
}

describe("routeAfterRouter", () => {
  it("routes DUVIDA to doubt_resolution", () => {
    expect(routeAfterRouter(makeState({ intent: "DUVIDA" }))).toBe(
      "doubt_resolution"
    );
  });

  it("routes AGENDAMENTO to scheduling", () => {
    expect(routeAfterRouter(makeState({ intent: "AGENDAMENTO" }))).toBe(
      "scheduling"
    );
  });

  it("routes CANCELAMENTO to scheduling", () => {
    expect(routeAfterRouter(makeState({ intent: "CANCELAMENTO" }))).toBe(
      "scheduling"
    );
  });

  it("routes PRE_ANAMNESE to pre_anamnesis", () => {
    expect(routeAfterRouter(makeState({ intent: "PRE_ANAMNESE" }))).toBe(
      "pre_anamnesis"
    );
  });

  it("routes NAO_IDENTIFICADO to END", () => {
    expect(routeAfterRouter(makeState({ intent: "NAO_IDENTIFICADO" }))).toBe(
      "__end__"
    );
  });
});

describe("routeAfterDoubt", () => {
  it("always routes to END", () => {
    expect(routeAfterDoubt(makeState())).toBe("__end__");
  });
});

describe("routeAfterScheduling", () => {
  it("always routes to END", () => {
    expect(routeAfterScheduling(makeState())).toBe("__end__");
  });
});

describe("routeAfterPreAnamnesis", () => {
  it("always routes to END", () => {
    expect(routeAfterPreAnamnesis(makeState())).toBe("__end__");
  });
});
