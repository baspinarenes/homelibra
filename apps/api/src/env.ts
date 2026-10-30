import { z } from 'zod';

const commaSeparatedList = z
  .string()
  .default('')
  .transform((s) =>
    s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
  );

export const env = z
  .object({
    PORT: z.coerce.number().default(3000),
    /** Connects as homelibra_app, the role that owns no tables. */
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    /** Without a key, sign-in codes are printed to the console. */
    RESEND_API_KEY: z.string().optional(),
    MAIL_FROM: z.string().default('Homelibra <giris@homelibra.app>'),
    /** Origins Better Auth accepts, e.g. the app scheme `homelibra://`. */
    TRUSTED_ORIGINS: commaSeparatedList,
    CORS_ORIGINS: commaSeparatedList,
  })
  // Production sends codes through Resend and is same-origin: never log
  // codes to the console or open CORS there.
  .refine((e) => process.env.NODE_ENV !== 'production' || (e.RESEND_API_KEY && e.CORS_ORIGINS.length === 0), {
    message: 'production needs RESEND_API_KEY and no CORS_ORIGINS',
  })
  .parse(process.env);
