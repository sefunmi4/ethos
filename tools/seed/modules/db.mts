import 'dotenv/config';
import { Pool } from 'pg';

function getDbUrl() {
  return (
    process.env.ETHOS_DATABASE_URL ??
    'postgres://ethos:ethos@localhost:5432/ethos'
  );
}

export const pool = new Pool({ connectionString: getDbUrl() });

export function loadEnv() {
  return { databaseUrl: getDbUrl() };
}
