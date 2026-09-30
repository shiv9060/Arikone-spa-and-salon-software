import { WhatsAppMessageType } from "@prisma/client";

export const ALLOWED_TEMPLATE_VARIABLES = [
  "customer_name",
  "business_name",
  "appointment_date",
  "appointment_time",
  "service_name",
  "staff_name",
  "invoice_number",
  "invoice_total",
  "amount_paid",
  "amount_due",
  "business_phone",
  "offer_name",
  "offer_discount",
  "coupon_code",
] as const;

export type TemplateVariable = typeof ALLOWED_TEMPLATE_VARIABLES[number];

export function extractVariables(templateContent: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const matches = [...templateContent.matchAll(regex)];
  return matches.map((m) => m[1].trim());
}

export function validateTemplate(content: string): { valid: boolean; errors: string[] } {
  const variables = extractVariables(content);
  const errors: string[] = [];

  for (const v of variables) {
    if (!ALLOWED_TEMPLATE_VARIABLES.includes(v as TemplateVariable)) {
      errors.push(`Unknown variable: {{${v}}}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function compileTemplate(content: string, data: Record<string, string>): string {
  let compiled = content;
  
  for (const [key, value] of Object.entries(data)) {
    if (ALLOWED_TEMPLATE_VARIABLES.includes(key as TemplateVariable)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      compiled = compiled.replace(regex, value);
    }
  }

  return compiled;
}

export const DEFAULT_TEMPLATES: Record<WhatsAppMessageType, string> = {
  APPOINTMENT_CONFIRMATION: "Hello {{customer_name}},\n\nYour appointment at {{business_name}} is confirmed.\n\nDate: {{appointment_date}}\nTime: {{appointment_time}}\nService: {{service_name}}\nStaff: {{staff_name}}\n\nFor assistance:\n{{business_phone}}",
  APPOINTMENT_REMINDER: "Hello {{customer_name}},\n\nThis is a friendly reminder for your appointment at {{business_name}} tomorrow.\n\nDate: {{appointment_date}}\nTime: {{appointment_time}}\nService: {{service_name}}\n\nSee you soon!",
  APPOINTMENT_CANCELLED: "Hello {{customer_name}},\n\nYour appointment at {{business_name}} on {{appointment_date}} at {{appointment_time}} has been cancelled.\n\nFor assistance:\n{{business_phone}}",
  INVOICE: "Hello {{customer_name}},\n\nThank you for visiting {{business_name}}.\n\nYour invoice {{invoice_number}} for {{invoice_total}} has been generated.\nAmount Paid: {{amount_paid}}\nAmount Due: {{amount_due}}\n\nHave a great day!",
  BIRTHDAY_GREETING: "Happy Birthday {{customer_name}}!\n\nWishing you a wonderful day from {{business_name}}.\n\nWe look forward to seeing you again.",
  THANK_YOU: "Hello {{customer_name}},\n\nThank you for visiting {{business_name}} today. We hope you enjoyed your service.\n\nSee you again soon!",
  FEEDBACK_REQUEST: "Hello {{customer_name}},\n\nThank you for visiting {{business_name}}! We'd love to hear about your experience.\n\nPlease share your feedback here: {{feedback_link}}",
  OTHER: "Hello {{customer_name}},\n\nA message from {{business_name}}:\n\nFor assistance:\n{{business_phone}}",
};
