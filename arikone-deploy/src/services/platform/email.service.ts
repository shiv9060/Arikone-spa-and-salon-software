import { getPlatformSettings } from './settings.service';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface EmailProvider {
  sendEmail(options: EmailOptions): Promise<{ success: boolean; message?: string }>;
}

class MockEmailProvider implements EmailProvider {
  async sendEmail(options: EmailOptions) {
    console.log('[MockEmail] Sending email to:', options.to);
    console.log('[MockEmail] Subject:', options.subject);
    return { success: true, message: 'Mock email sent successfully' };
  }
}

// Future: SMTPProvider, ResendProvider...

export async function getEmailProvider(): Promise<EmailProvider> {
  const settings = await getPlatformSettings();
  
  // Here you could read settings to determine provider.
  // For development, return mock:
  return new MockEmailProvider();
}

export async function sendTestEmail(to: string) {
  const provider = await getEmailProvider();
  return provider.sendEmail({
    to,
    subject: 'Arikone Test Email',
    text: 'This is a test email from the Arikone Platform.'
  });
}
