import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const runMigration = async () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  console.log('🔄 Running migrations...');

  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  await migrate(db, {
    migrationsFolder: './src/database/migrations',
  });

  console.log('✅ Migrations completed successfully');

  await migrationClient.end();
  process.exit(0);
};

runMigration().catch((err) => {
  console.error('❌ Migration failed');
  console.error(err);
  process.exit(1);
});
