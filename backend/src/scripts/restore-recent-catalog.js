/**
 * Restaura catálogo recente (~3700): listas usam UPDATE (created_at antigo, updated_at de hoje/ontem).
 *
 *   npm run db:restore-recent-catalog
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { restoreRecentCatalog } from '../services/restoreRecentCatalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
  console.log('\n📦 Restaurando catálogo recente (hoje / ontem / anteontem SP)...\n');
  const r = await restoreRecentCatalog();
  console.log(r);
  console.log('\nRecarregue a busca (F5).\n');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
