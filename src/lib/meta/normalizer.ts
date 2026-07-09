import type {
  StandardMessage,
  MetaPlatform,
  WhatsAppWebhookEntry,
  InstagramWebhookEntry,
  FacebookWebhookEntry,
  MetaWebhookBody,
} from "@/types/meta";

function normalizeWhatsApp(body: WhatsAppWebhookEntry): StandardMessage[] {
  const results: StandardMessage[] = [];

  for (const entry of body.entry) {
    for (const change of entry.changes) {
      const msgs = change.value?.messages;
      if (!msgs?.length) continue;

      for (const msg of msgs) {
        let text = "";

        if (msg.type === "text" && msg.text) {
          text = msg.text.body;
        } else if (msg.type === "interactive" && msg.interactive) {
          text =
            msg.interactive.button_reply?.title ||
            msg.interactive.list_reply?.title ||
            "";
        } else if (msg.type === "button" && msg.button) {
          text = msg.button.text;
        }

        results.push({
          platform: "whatsapp",
          senderId: msg.from,
          text,
          timestamp: parseInt(msg.timestamp, 10) * 1000,
          messageId: msg.id,
        });
      }
    }
  }

  return results;
}

function normalizeInstagramOrFacebook(
  body: InstagramWebhookEntry | FacebookWebhookEntry,
  platform: "instagram" | "messenger"
): StandardMessage[] {
  const results: StandardMessage[] = [];

  for (const entry of body.entry) {
    const messaging = entry.messaging;
    if (!messaging?.length) continue;

    for (const event of messaging) {
      const msg = event.message;
      if (!msg) continue;

      results.push({
        platform,
        senderId: event.sender.id,
        text: msg.text || "",
        timestamp: event.timestamp,
        messageId: msg.mid,
      });
    }
  }

  return results;
}

export function detectPlatform(body: unknown): MetaPlatform | null {
  if (!body || typeof body !== "object") return null;

  const obj = body as Record<string, unknown>;

  if (obj.object === "whatsapp_business_account") return "whatsapp";
  if (obj.object === "instagram") return "instagram";
  if (obj.object === "page") return "messenger";

  return null;
}

export function normalizeMessage(body: MetaWebhookBody): StandardMessage[] {
  const platform = detectPlatform(body);
  if (!platform) return [];

  switch (platform) {
    case "whatsapp":
      return normalizeWhatsApp(body as WhatsAppWebhookEntry);
    case "instagram":
      return normalizeInstagramOrFacebook(
        body as InstagramWebhookEntry,
        "instagram"
      );
    case "messenger":
      return normalizeInstagramOrFacebook(
        body as FacebookWebhookEntry,
        "messenger"
      );
  }
}
