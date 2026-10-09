import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MockWhatsAppProvider } from "../../src/lib/whatsapp/mock-provider";
import { validateTemplate, compileTemplate } from "../../src/lib/whatsapp/templates";

describe("WhatsApp Integration Tests", () => {
  describe("Mock Provider", () => {
    it("Mock provider sends without external API", async () => {
      const provider = new MockWhatsAppProvider();
      const result = await provider.sendMessage({
        to: "1234567890",
        content: "Test message",
        messageType: "OTHER",
      });
      expect(result.success).toBe(true);
      expect(result.providerMessageId).toBeDefined();
    });
  });

  describe("Templates", () => {
    it("Valid template variables resolve", () => {
      const template = "Hello {{customer_name}}, your appointment is at {{appointment_time}}.";
      const data = {
        customer_name: "John Doe",
        appointment_time: "10:00 AM",
      };
      const compiled = compileTemplate(template, data);
      expect(compiled).toBe("Hello John Doe, your appointment is at 10:00 AM.");
    });

    it("Unknown variables are rejected", () => {
      const template = "Hello {{invalid_var}}";
      const validation = validateTemplate(template);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain("Unknown variable: {{invalid_var}}");
    });
  });
});
