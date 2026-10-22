import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { readConfig } from '../config';

const getSecret = () => {
  const config = readConfig();
  return new TextEncoder().encode(config.jwtSecret);
};

export async function createAccessToken(
  userId: string,
  jti: string,
  expiresAt: Date,
): Promise<string> {
  const config = readConfig();

  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(userId)
    .setJti(jti)
    .setIssuer(config.jwtIssuer)
    .setAudience(config.jwtAudience)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(getSecret());
}

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const config = readConfig();

  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: ['HS256'],
    issuer: config.jwtIssuer,
    audience: config.jwtAudience,
  });

  return payload;
}
