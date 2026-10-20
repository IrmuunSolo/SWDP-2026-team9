import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
// fileURLToPath is needed for Unicode/space paths on Windows.
const repo = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(resolve(repo, 'package.json'), 'utf8'));
assert.deepEqual(manifest.workspaces, ['frontend', 'backend', 'database', 'packages/*']);
const layerNames = ['frontend', 'backend', 'database', 'packages/contracts'];
async function checkFiles(directory, layer) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['node_modules', 'dist'].includes(entry.name)) continue;
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await checkFiles(file, layer);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(file)) continue;
    const text = await readFile(file, 'utf8');
    const imports = [...text.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)].map((m) => m[1]);
    for (const specifier of imports) {
      if (layer === 'frontend')
        assert(
          !specifier.startsWith('@campusfind/database') &&
            !specifier.startsWith('@prisma/') &&
            !specifier.startsWith('@nestjs/'),
          `Frontend data/server import: ${file}`,
        );
      if (layer === 'database')
        assert(
          !specifier.startsWith('@nestjs/') && !specifier.startsWith('react'),
          `Database framework import: ${file}`,
        );
      if (layer === 'backend')
        assert(specifier !== '@prisma/client', `Use @campusfind/database: ${file}`);
      if (layer === 'packages/contracts')
        assert(
          !specifier.startsWith('@campusfind/database') &&
            !specifier.startsWith('@nestjs/') &&
            !specifier.startsWith('react'),
          `Contract dependency inversion: ${file}`,
        );
      if (specifier.startsWith('.')) {
        const target = resolve(dirname(file), specifier),
          own = resolve(repo, layer) + sep;
        assert(target.startsWith(own), `Cross-layer relative import: ${file} -> ${specifier}`);
      }
    }
  }
}
for (const layer of layerNames) await checkFiles(resolve(repo, layer, 'src'), layer);
const dataManifest = JSON.parse(await readFile(resolve(repo, 'database/package.json'), 'utf8'));
assert(
  !Object.keys(dataManifest.dependencies).some(
    (x) => x.startsWith('@nestjs/') || x.startsWith('react'),
  ),
);
console.log(
  'Layer boundaries: frontend → contracts; backend → database/contracts; database → contracts; no cross-layer relative imports.',
);
