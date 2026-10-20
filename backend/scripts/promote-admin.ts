import '../src/environment';
import { PrismaClient } from '@campusfind/database';
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error('npm run db:admin -w @campusfind/api -- verified@example.edu');
  const db = new PrismaClient();
  try {
    const user = await db.user.findUnique({ where: { email } });
    if (!user?.emailVerifiedAt || user.blockedAt)
      throw new Error('Баталгаажсан, идэвхтэй хэрэглэгч шаардлагатай');
    await db.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });
    console.log('Админ эрх олголоо:', email);
  } finally {
    await db.$disconnect();
  }
}
void main();
