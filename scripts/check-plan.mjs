import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url),
  { routes } = require('@campusfind/contracts');
const plan = JSON.parse(
  await readFile(new URL('../docs/planning/delivery-plan.json', import.meta.url), 'utf8'),
);
const periods = plan.weekBlocks.map((x) => x.id);
assert.deepEqual(periods, ['8-9', '10-11', '12-13', '14-15']);
assert.deepEqual(plan.layers, {
  frontend: 'irmuun',
  backend: 'narmandakh',
  database: 'amarbold',
  devops: 'amarbold',
});
const stories = new Map();
for (const item of plan.stories) {
  assert(!stories.has(item.id), 'Duplicate story');
  assert(periods.includes(item.weekBlock));
  for (const layer of ['frontend', 'api', 'data'])
    assert(plan.members[item[layer]], 'Unknown owner');
  assert.equal(item.frontend, 'irmuun');
  assert.equal(item.data, 'amarbold');
  assert.equal(item.api, ['US-11', 'US-15'].includes(item.id) ? 'amarbold' : 'narmandakh');
  stories.set(item.id, item);
}
assert.equal(stories.size, 15);
assert.equal(
  [...stories.values()].reduce((n, x) => n + x.points, 0),
  70,
);
const visiting = new Set(),
  visited = new Set();
function visit(id) {
  assert(!visiting.has(id), 'Dependency cycle');
  if (visited.has(id)) return;
  visiting.add(id);
  for (const d of stories.get(id).dependsOn) {
    assert(stories.has(d));
    assert(
      periods.indexOf(stories.get(d).weekBlock) <= periods.indexOf(stories.get(id).weekBlock),
      'Dependency planned too late',
    );
    visit(d);
  }
  visiting.delete(id);
  visited.add(id);
}
for (const id of stories.keys()) visit(id);
const keys = new Set();
for (const r of routes) {
  const key = r.method + r.path;
  assert(!keys.has(key), 'Duplicate API route');
  keys.add(key);
  assert(plan.members[r.owner]);
  assert(periods.includes(r.weekBlock));
  assert.equal(r.frontendOwner, 'irmuun');
  assert.equal(r.dataOwner, 'amarbold');
  for (const id of r.stories) {
    assert(stories.has(id));
    assert.equal(r.owner, stories.get(id).api, 'API owner disagrees with active plan');
  }
}
console.log(
  'Active plan: weeks 8–15; 15 stories / 70 SP; layer owners match; no dependency cycles or duplicate routes.',
);
