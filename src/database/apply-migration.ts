import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL || '');

async function runMigration() {
  try {
    console.log('🔄 Applying video progress migration...');

    const migrationSql = readFileSync(
      join(__dirname, 'migrations', 'add-video-progress.sql'),
      'utf-8'
    );

    await sql.unsafe(migrationSql);

    console.log('✅ Migration applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
