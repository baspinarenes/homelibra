import { Resend } from 'resend';

/** The edge where sign-in codes leave the system; tests swap in a fake. */
export interface Mailer {
  sendSignInCode(email: string, code: string): Promise<void>;
}

export function resendMailer({ apiKey, from }: { apiKey: string; from: string }): Mailer {
  const resend = new Resend(apiKey);
  return {
    async sendSignInCode(email, code) {
      const { error } = await resend.emails.send({
        from,
        to: email,
        subject: `Homelibra giriş kodun: ${code}`,
        text: `Homelibra'ya giriş kodun: ${code}\n\nKod 10 dakika geçerli. Bu girişi sen istemediysen bu e-postayı yok sayabilirsin.`,
      });
      if (error) throw new Error(`Resend: ${error.message}`);
    },
  };
}

/** Logs codes to the console; for local development without a Resend key. */
export function consoleMailer(): Mailer {
  return {
    async sendSignInCode(email, code) {
      console.info(`[mail] sign-in code for ${email}: ${code}`);
    },
  };
}
