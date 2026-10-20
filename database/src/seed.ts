import { randomBytes, scryptSync } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
// Explicit, repeatable LOCAL fixtures. Never automatically run this in CI/production.
async function main() {
  const url = new URL(process.env.DATABASE_URL ?? '');
  if (
    process.env.NODE_ENV === 'production' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  )
    throw new Error('Seed зөвхөн локал development DB дээр ажиллана');
  const password = process.env.SEED_DEMO_PASSWORD;
  if (!password || password.length < 12 || password.length > 128)
    throw new Error('SEED_DEMO_PASSWORD-д 12–128 тэмдэгттэй локал demo нууц үг өгнө үү');
  const salt = randomBytes(16).toString('hex');
  // Same documented scrypt encoding as backend; only creates trusted local fixtures.
  const passwordHash = `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`;
  const db = new PrismaClient();
  try {
    const users = [];
    for (const [i, name] of ['owner', 'finder', 'visitor'].entries()) {
      users.push(
        await db.user.upsert({
          where: { email: `${name}@example.edu` },
          update: {},
          create: {
            email: `${name}@example.edu`,
            displayName: `Demo ${name}`,
            studentCode: `D${String(i + 1).padStart(9, '0')}`,
            passwordHash,
            emailVerifiedAt: new Date(),
          },
        }),
      );
    }
    const common = {
      category: 'KEYS',
      location: 'LIBRARY',
      occurredOn: new Date('2026-09-20T00:00:00Z'),
    };
    await db.post.upsert({
      where: { id: '10000000-0000-4000-8000-000000000001' },
      update: {},
      create: {
        id: '10000000-0000-4000-8000-000000000001',
        ...common,
        type: 'LOST',
        authorId: users[0].id,
        title: 'Гээгдсэн demo түлхүүр',
        description: 'Локал seed өгөгдөл',
      },
    });
    await db.post.upsert({
      where: { id: '10000000-0000-4000-8000-000000000002' },
      update: {},
      create: {
        id: '10000000-0000-4000-8000-000000000002',
        ...common,
        type: 'FOUND',
        authorId: users[1].id,
        title: 'Олдсон demo түлхүүр',
        description: 'Локал seed өгөгдөл',
        handoverMethod: 'GUARD',
        guardLocation: 'MAIN',
      },
    });
    console.log(
      '3 local MEMBER fixture + 2 post бэлэн. Existing account/password/post-ыг дарж бичээгүй.',
    );
  } finally {
    await db.$disconnect();
  }
}
void main();
