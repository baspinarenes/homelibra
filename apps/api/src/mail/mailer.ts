import { Resend } from 'resend';

import { contactEmail } from '../contact';

/**
 * The edge where account emails leave the system; tests swap in a fake.
 * Every message is about the Account itself and promotes nothing, so none
 * needs the scholar's consent (ETK m.6/2; docs/research/kvkk-obligations.md).
 */
export interface Mailer {
  sendSignInCode(email: string, code: string): Promise<void>;
  /** The code that proves the scholar holds the address they are moving their Account to. */
  sendEmailChangeCode(newEmail: string, code: string): Promise<void>;
  /** Tells the address an Account just left where it went, in case the scholar did not ask for it. */
  sendEmailChangedNotice(oldEmail: string, newEmail: string): Promise<void>;
}

type Message = { to: string; subject: string; text: string };

const messages = {
  signInCode: (email: string, code: string): Message => ({
    to: email,
    subject: `Homelibra giriş kodun: ${code}`,
    text: `Homelibra'ya giriş kodun: ${code}\n\nKod 10 dakika geçerli. Bu girişi sen istemediysen bu e-postayı yok sayabilirsin.`,
  }),
  emailChangeCode: (newEmail: string, code: string): Message => ({
    to: newEmail,
    subject: `Homelibra e-posta değiştirme kodun: ${code}`,
    text: `Homelibra hesabının e-posta adresini ${newEmail} yapmak için kodun: ${code}\n\nKod 10 dakika geçerli. Bunu sen istemediysen bu e-postayı yok sayabilirsin.`,
  }),
  emailChangedNotice: (oldEmail: string, newEmail: string): Message => ({
    to: oldEmail,
    subject: 'Homelibra hesabının e-posta adresi değişti',
    text: `Homelibra hesabının e-posta adresi ${newEmail} olarak değiştirildi. Bundan sonra girişler o adresle yapılır.\n\nBu değişikliği sen yapmadıysan hemen ${contactEmail} adresine yaz.`,
  }),
};

/** A Mailer that hands every message to `deliver`. */
function mailerFrom(deliver: (message: Message) => Promise<void>): Mailer {
  return {
    sendSignInCode: (email, code) => deliver(messages.signInCode(email, code)),
    sendEmailChangeCode: (newEmail, code) => deliver(messages.emailChangeCode(newEmail, code)),
    sendEmailChangedNotice: (oldEmail, newEmail) => deliver(messages.emailChangedNotice(oldEmail, newEmail)),
  };
}

export function resendMailer({ apiKey, from }: { apiKey: string; from: string }): Mailer {
  const resend = new Resend(apiKey);
  return mailerFrom(async (message) => {
    const { error } = await resend.emails.send({ from, ...message });
    if (error) throw new Error(`Resend: ${error.message}`);
  });
}

/** Logs each message's subject, which carries any code; for local development without a Resend key. */
export function consoleMailer(): Mailer {
  return mailerFrom(async ({ to, subject }) => {
    console.info(`[mail] to ${to}: ${subject}`);
  });
}
