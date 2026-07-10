import { getOrCreateSession, getChatMessages, saveChatMessage } from "@/lib/chat/session";

var mockDb: Record<string, jest.Mock>;

jest.mock("@/db", () => {
  const chain = {
    select: jest.fn(),
    insert: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    values: jest.fn(),
  };
  mockDb = chain;
  return { db: chain };
});

function setupChain() {
  mockDb.select.mockReturnValue(mockDb);
  mockDb.from.mockReturnValue(mockDb);
  mockDb.where.mockReturnValue(mockDb);
  mockDb.insert.mockReturnValue(mockDb);
  mockDb.orderBy.mockResolvedValue([]);
  mockDb.limit.mockResolvedValue([]);
  mockDb.values.mockResolvedValue(undefined);
}

beforeEach(() => {
  jest.clearAllMocks();
  setupChain();
});

describe("getOrCreateSession", () => {
  it("returns existing session id when session found", async () => {
    mockDb.limit.mockResolvedValue([{ id: "session-abc" }]);

    const result = await getOrCreateSession("session-abc", "clinic-1");

    expect(result).toBe("session-abc");
    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("creates new session when not found", async () => {
    mockDb.limit.mockResolvedValue([]);

    const result = await getOrCreateSession("new-id", "clinic-1");

    expect(result).toBe("new-id");
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalledWith({
      sessionId: "new-id",
      clinicId: "clinic-1",
    });
  });

  it("creates session without clinicId", async () => {
    mockDb.limit.mockResolvedValue([]);

    await getOrCreateSession("no-clinic");

    expect(mockDb.values).toHaveBeenCalledWith({
      sessionId: "no-clinic",
      clinicId: undefined,
    });
  });
});

describe("getChatMessages", () => {
  const messages = [
    { id: "1", sessionId: "s1", role: "user", content: "Ola", createdAt: new Date("2025-01-01") },
    { id: "2", sessionId: "s1", role: "assistant", content: "Oi", createdAt: new Date("2025-01-01") },
  ];

  it("returns messages for a session", async () => {
    mockDb.orderBy.mockResolvedValue(messages);

    const result = await getChatMessages("s1");

    expect(result).toHaveLength(2);
    expect(result[0].role).toBe("user");
    expect(result[1].role).toBe("assistant");
  });

  it("returns empty array when no messages", async () => {
    mockDb.orderBy.mockResolvedValue([]);

    const result = await getChatMessages("empty");

    expect(result).toEqual([]);
  });
});

describe("saveChatMessage", () => {
  it("inserts a user message", async () => {
    await saveChatMessage("s1", "user", "Hello");

    expect(mockDb.values).toHaveBeenCalledWith({
      sessionId: "s1",
      role: "user",
      content: "Hello",
    });
  });

  it("inserts an assistant message", async () => {
    await saveChatMessage("s1", "assistant", "Hi there");

    expect(mockDb.values).toHaveBeenCalledWith({
      sessionId: "s1",
      role: "assistant",
      content: "Hi there",
    });
  });
});
