export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  const origin = env.WEB_ORIGIN ?? 'http://localhost:5173';
  const domains = (env.UNIVERSITY_EMAIL_DOMAINS ?? '')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  if (!domains.length) throw new Error('UNIVERSITY_EMAIL_DOMAINS тохируулна уу');
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL тохируулна уу');
  if (
    env.NODE_ENV === 'production' &&
    (!origin.startsWith('https://') || domains.includes('example.edu'))
  )
    throw new Error('Production-д HTTPS ба бодит сургуулийн домэйн шаардлагатай');
  return {
    origin,
    domains,
    production: env.NODE_ENV === 'production',
    port: Number(env.PORT ?? 3000),
  };
}
