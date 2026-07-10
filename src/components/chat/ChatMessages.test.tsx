import { render, screen } from "@testing-library/react";
import { ChatMessages } from "./ChatMessages";

beforeEach(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

describe("ChatMessages", () => {
  it("shows empty state when no messages", () => {
    render(<ChatMessages messages={[]} loading={false} />);

    expect(screen.getByText("Envie uma mensagem para começar.")).toBeInTheDocument();
  });

  it("does not show empty state when loading with no messages", () => {
    render(<ChatMessages messages={[]} loading={true} />);

    expect(screen.queryByText("Envie uma mensagem para começar.")).not.toBeInTheDocument();
  });

  it("renders user messages on the right", () => {
    render(<ChatMessages messages={[{ role: "user", content: "Ola" }]} loading={false} />);

    expect(screen.getByText("Ola")).toBeInTheDocument();
    expect(screen.getByText("V")).toBeInTheDocument();
  });

  it("renders assistant messages on the left", () => {
    render(<ChatMessages messages={[{ role: "assistant", content: "Oi" }]} loading={false} />);

    expect(screen.getByText("Oi")).toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("renders both user and assistant messages", () => {
    render(
      <ChatMessages
        messages={[
          { role: "user", content: "Ola" },
          { role: "assistant", content: "Como posso ajudar?" },
        ]}
        loading={false}
      />
    );

    expect(screen.getByText("Ola")).toBeInTheDocument();
    expect(screen.getByText("Como posso ajudar?")).toBeInTheDocument();
  });

  it("shows timestamp when provided", () => {
    render(
      <ChatMessages
        messages={[{ role: "user", content: "Ola", timestamp: "2025-06-01T10:30:00" }]}
        loading={false}
      />
    );

    expect(screen.getByText("10:30")).toBeInTheDocument();
  });

  it("shows typing indicator when loading", () => {
    render(<ChatMessages messages={[{ role: "user", content: "Ola" }]} loading={true} />);

    const dots = document.querySelectorAll(".animate-bounce");
    expect(dots.length).toBe(3);
  });

  it("does not show typing indicator when not loading", () => {
    render(<ChatMessages messages={[]} loading={false} />);

    const dots = document.querySelectorAll(".animate-bounce");
    expect(dots.length).toBe(0);
  });
});
