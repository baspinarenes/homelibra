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
    MAIL_FROM: z.string().default('Homelibra <giris@homelibra.com>'),
    /** Google sign-in's OAuth web client. Without it only email codes work. */
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    /** Origins Better Auth accepts, e.g. the app scheme `homelibra://`. */
    TRUSTED_ORIGINS: commaSeparatedList,
    CORS_ORIGINS: commaSeparatedList,
    /**
     * The private covers bucket (ADR-0011), on the Operator's S3-compatible
     * Object Storage. Without these, development keeps Covers in COVERS_DIR.
     */
    COVERS_S3_ENDPOINT: z.string().url().optional(),
    COVERS_S3_REGION: z.string().default('fsn1'),
    COVERS_S3_BUCKET: z.string().default('homelibra-covers'),
    COVERS_S3_ACCESS_KEY_ID: z.string().optional(),
    COVERS_S3_SECRET_ACCESS_KEY: z.string().optional(),
    COVERS_DIR: z.string().default('.covers'),
  })
  // Production sends codes through Resend and is same-origin: never log
  // codes to the console or open CORS there.
  .refine((e) => process.env.NODE_ENV !== 'production' || (e.RESEND_API_KEY && e.CORS_ORIGINS.length === 0), {
    message: 'production needs RESEND_API_KEY and no CORS_ORIGINS',
  })
  .refine((e) => !e.GOOGLE_CLIENT_ID === !e.GOOGLE_CLIENT_SECRET, {
    message: 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET come together',
  })
  .refine(
    (e) =>
      !e.COVERS_S3_ENDPOINT === !e.COVERS_S3_ACCESS_KEY_ID &&
      !e.COVERS_S3_ACCESS_KEY_ID === !e.COVERS_S3_SECRET_ACCESS_KEY,
    { message: 'COVERS_S3_ENDPOINT, COVERS_S3_ACCESS_KEY_ID and COVERS_S3_SECRET_ACCESS_KEY come together' },
  )
  // A container's disk is no place for Covers.
  .refine((e) => process.env.NODE_ENV !== 'production' || e.COVERS_S3_ENDPOINT, {
    message: 'production needs the COVERS_S3_* bucket settings',
  })
  // The beta offers Google sign-in on every platform.
  .refine((e) => process.env.NODE_ENV !== 'production' || e.GOOGLE_CLIENT_ID, {
    message: 'production needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET',
  })
  .parse(process.env);
