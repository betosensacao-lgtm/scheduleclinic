import type { MetaPlatform } from "@/types/meta";

const META_API_BASE = "https://graph.facebook.com/v21.0";

function getCredentials(platform: MetaPlatform): {
  token: string;
  recipientField: "to" | "recipient";
  apiPath: string;
} {
  switch (platform) {
    case "whatsapp": {
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      if (!phoneNumberId) throw new Error("WHATSAPP_PHONE_NUMBER_ID not set");
      return {
        token: process.env.WHATSAPP_TOKEN || "",
        recipientField: "to",
        apiPath: `${phoneNumberId}/messages`,
      };
    }
    case "instagram": {
      const igUserId = process.env.INSTAGRAM_USER_ID;
      if (!igUserId) throw new Error("INSTAGRAM_USER_ID not set");
      return {
        token: process.env.PAGE_ACCESS_TOKEN || "",
        recipientField: "recipient",
        apiPath: `${igUserId}/messages`,
      };
    }
    case "messenger": {
      const pageId = process.env.FACEBOOK_PAGE_ID;
      if (!pageId) throw new Error("FACEBOOK_PAGE_ID not set");
      return {
        token: process.env.PAGE_ACCESS_TOKEN || "",
        recipientField: "recipient",
        apiPath: `${pageId}/messages`,
      };
    }
  }
}

async function sendWhatsApp(
  toId: string,
  text: string,
  token: string,
  apiPath: string
): Promise<void> {
  const res = await fetch(`${META_API_BASE}/${apiPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toId,
      type: "text",
      text: { preview_url: false, body: text },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp send error: ${err}`);
  }
}

async function sendInstagramOrMessenger(
  toId: string,
  text: string,
  token: string,
  apiPath: string
): Promise<void> {
  const res = await fetch(`${META_API_BASE}/${apiPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient: { id: toId },
      messaging_type: "RESPONSE",
      message: { text },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Messenger/IG send error: ${err}`);
  }
}

export async function sendMessageToMeta(
  platform: MetaPlatform,
  toId: string,
  text: string
): Promise<void> {
  const { token, recipientField, apiPath } = getCredentials(platform);

  if (platform === "whatsapp") {
    await sendWhatsApp(toId, text, token, apiPath);
  } else {
    await sendInstagramOrMessenger(toId, text, token, apiPath);
  }
}
