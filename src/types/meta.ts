export type MetaPlatform = "whatsapp" | "instagram" | "messenger";

export interface StandardMessage {
  platform: MetaPlatform;
  senderId: string;
  text: string;
  timestamp: number;
  messageId: string;
}

export interface WhatsAppWebhookEntry {
  object: "whatsapp_business_account";
  entry: Array<{
    id: string;
    changes: Array<{
      field: string;
      value: {
        messaging_product: "whatsapp";
        metadata: {
          phone_number_id: string;
          display_phone_number: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: "text" | "interactive" | "button" | "image" | "document";
          text?: { body: string };
          interactive?: {
            type: "button" | "list";
            button_reply?: { id: string; title: string };
            list_reply?: { id: string; title: string; description?: string };
          };
          button?: { payload: string; text: string };
        }>;
      };
    }>;
  }>;
}

export interface InstagramWebhookEntry {
  object: "instagram";
  entry: Array<{
    id: string;
    time: number;
    messaging: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: {
        mid: string;
        text?: string;
        attachments?: Array<{
          type: string;
          payload: { url: string };
        }>;
      };
      postback?: {
        mid: string;
        payload: string;
        title?: string;
      };
    }>;
  }>;
}

export interface FacebookWebhookEntry {
  object: "page";
  entry: Array<{
    id: string;
    time: number;
    messaging: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: {
        mid: string;
        text?: string;
        attachments?: Array<{
          type: string;
          payload: { url: string };
        }>;
      };
      postback?: {
        mid: string;
        payload: string;
        title?: string;
      };
    }>;
  }>;
}

export type MetaWebhookBody =
  | WhatsAppWebhookEntry
  | InstagramWebhookEntry
  | FacebookWebhookEntry;
