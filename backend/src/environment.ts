import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { config } from 'dotenv';
function findRepositoryRoot() {
  let current = __dirname;
  while (true) {
    const manifest = join(current, 'package.json');
    if (existsSync(manifest) && JSON.parse(readFileSync(manifest, 'utf8')).name === 'campusfind')
      return current;
    const parent = dirname(current);
    if (parent === current) throw new Error('CampusFind repo root олдсонгүй');
    current = parent;
  }
}
export const REPOSITORY_ROOT = findRepositoryRoot();
config({ path: join(REPOSITORY_ROOT, '.env'), quiet: true });
