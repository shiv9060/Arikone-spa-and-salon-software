import { WhatsAppMessageType } from "@prisma/client";

export interface WhatsAppConfig {
  provider: "MOCK" | "CLOUD_API";
  apiUrl?: string;
  accessToken?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
}

export interface SendMessageOptions {
  to: string;
  content: string;
  messageType: WhatsAppMessageType;
}

export interface SendMessageResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface IWhatsAppProvider {
  sendMessage(options: SendMessageOptions): Promise<SendMessageResult>;
  checkMessageStatus?(providerMessageId: string): Promise<string>;
}
