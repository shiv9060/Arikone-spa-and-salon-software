import { MockWhatsAppProvider } from "./mock-provider";
import { CloudWhatsAppProvider } from "./cloud-provider";
import { IWhatsAppProvider } from "./types";

export function getWhatsAppProvider(): IWhatsAppProvider {
  const providerType = process.env.WHATSAPP_PROVIDER || "MOCK";

  if (providerType === "CLOUD_API") {
    return new CloudWhatsAppProvider({
      provider: "CLOUD_API",
      apiUrl: process.env.WHATSAPP_API_URL,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    });
  }

  // Default to mock for development and safety
  return new MockWhatsAppProvider();
}
