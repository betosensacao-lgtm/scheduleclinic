import { cn, formatDate, formatTime, generateTimeSlots, getSpecialtyLabel, getSpecialtyEmoji, getStatusColor, slugify } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("resolves Tailwind conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "extra")).toBe("base extra");
  });
});

describe("formatDate", () => {
  it("formats a Date object", () => {
    const date = new Date(2025, 0, 15); // Jan 15, 2025
    expect(formatDate(date)).toBe("Jan 15, 2025");
  });

  it("formats an ISO string", () => {
    expect(formatDate("2025-03-22")).toBe("Mar 22, 2025");
  });

  it("accepts custom format", () => {
    const date = new Date(2025, 5, 10);
    expect(formatDate(date, "dd/MM/yyyy")).toBe("10/06/2025");
  });
});

describe("formatTime", () => {
  it("formats morning time", () => {
    expect(formatTime("09:30")).toBe("9:30 AM");
  });

  it("formats noon", () => {
    expect(formatTime("12:00")).toBe("12:00 PM");
  });

  it("formats afternoon time", () => {
    expect(formatTime("14:15")).toBe("2:15 PM");
  });

  it("formats midnight", () => {
    expect(formatTime("00:00")).toBe("12:00 AM");
  });

  it("formats end of day", () => {
    expect(formatTime("23:59")).toBe("11:59 PM");
  });
});

describe("generateTimeSlots", () => {
  it("generates 30-min slots for a standard morning", () => {
    const slots = generateTimeSlots("08:00", "12:00", 30);
    expect(slots).toEqual(["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]);
  });

  it("excludes break time", () => {
    const slots = generateTimeSlots("08:00", "14:00", 30, "11:30", "12:30");
    expect(slots).not.toContain("11:30");
    expect(slots).not.toContain("12:00");
    expect(slots).toContain("12:30");
  });

  it("returns empty array when end <= start", () => {
    expect(generateTimeSlots("12:00", "12:00", 30)).toEqual([]);
  });

  it("handles 60-min slots", () => {
    const slots = generateTimeSlots("09:00", "12:00", 60);
    expect(slots).toEqual(["09:00", "10:00", "11:00"]);
  });

  it("handles slots that don't align with break end", () => {
    const slots = generateTimeSlots("08:00", "13:00", 30, "10:00", "10:45");
    expect(slots).toContain("09:30");
    expect(slots).not.toContain("10:00");
    expect(slots).not.toContain("10:30");
    expect(slots).toContain("10:45");
  });
});

describe("getSpecialtyLabel", () => {
  it("returns label for known specialty", () => {
    expect(getSpecialtyLabel("cardiology")).toBe("Cardiology");
    expect(getSpecialtyLabel("dentistry")).toBe("Dentistry");
  });

  it("returns raw string for unknown specialty", () => {
    expect(getSpecialtyLabel("unknown_spec")).toBe("unknown_spec");
  });
});

describe("getSpecialtyEmoji", () => {
  it("returns emoji for known specialty", () => {
    expect(getSpecialtyEmoji("dentistry")).toBe("🦷");
    expect(getSpecialtyEmoji("cardiology")).toBe("🫀");
  });

  it("returns default emoji for unknown specialty", () => {
    expect(getSpecialtyEmoji("xyz")).toBe("🏥");
  });
});

describe("getStatusColor", () => {
  it("returns correct Tailwind classes for each status", () => {
    expect(getStatusColor("pending")).toContain("yellow");
    expect(getStatusColor("confirmed")).toContain("teal");
    expect(getStatusColor("cancelled")).toContain("red");
    expect(getStatusColor("completed")).toContain("green");
    expect(getStatusColor("no_show")).toContain("gray");
  });

  it("returns gray for unknown status", () => {
    expect(getStatusColor("unknown")).toContain("gray");
  });
});

describe("slugify", () => {
  it("converts text to slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Dr. João's Clinic!")).toBe("dr-joos-clinic");
  });

  it("handles multiple spaces and underscores", () => {
    expect(slugify("  My   Clinic_Name  ")).toBe("my-clinic-name");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello");
  });
});
