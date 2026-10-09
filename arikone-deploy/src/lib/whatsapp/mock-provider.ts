import { IWhatsAppProvider, SendMessageOptions, SendMessageResult } from "./types";
import { randomUUID } from "crypto";

export class MockWhatsAppProvider implements IWhatsAppProvider {
  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    console.log(`[MOCK WHATSAPP] Sending message to ${options.to}: ${options.content}`);
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      providerMessageId: `mock-msg-${randomUUID()}`,
    };
  }

  async checkMessageStatus(providerMessageId: string): Promise<string> {
    return "DELIVERED";
  }
}
