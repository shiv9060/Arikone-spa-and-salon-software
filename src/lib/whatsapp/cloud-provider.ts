import { IWhatsAppProvider, SendMessageOptions, SendMessageResult, WhatsAppConfig } from "./types";

export class CloudWhatsAppProvider implements IWhatsAppProvider {
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    if (!this.config.accessToken || !this.config.phoneNumberId) {
      return {
        success: false,
        error: "Missing WhatsApp Cloud API credentials",
      };
    }

    try {
      const url = `https://graph.facebook.com/v18.0/${this.config.phoneNumberId}/messages`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: options.to,
          type: "text",
          text: {
            preview_url: false,
            body: options.content,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || "Unknown error from WhatsApp API",
        };
      }

      return {
        success: true,
        providerMessageId: data.messages?.[0]?.id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to send WhatsApp message",
      };
    }
  }
}
