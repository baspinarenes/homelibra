// Connection strings for the test database. Defaults match compose.yaml; CI overrides them.
export const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ?? 'postgres://homelibra_app:app@localhost:5432/homelibra_test';
export const testMigrationDatabaseUrl =
  process.env.TEST_MIGRATION_DATABASE_URL ?? 'postgres://homelibra_owner:owner@localhost:5432/homelibra_test';
