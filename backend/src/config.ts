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
  const jwtSecret = env.JWT_SECRET ?? '';

  if (Buffer.byteLength(jwtSecret, 'utf8') < 32) {
    throw new Error('JWT_SECRET хамгийн багадаа 32 byte байх ёстой');
  }

  const jwtIssuer = env.JWT_ISSUER ?? 'campusfind-api';
  const jwtAudience = env.JWT_AUDIENCE ?? 'campusfind-web';
  return {
    origin,
    domains,
    production: env.NODE_ENV === 'production',
    port: Number(env.PORT ?? 3000),
    jwtSecret,
    jwtIssuer,
    jwtAudience,
  };
}
