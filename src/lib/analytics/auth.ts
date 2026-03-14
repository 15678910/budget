import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

function getJWTSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error('ADMIN_JWT_SECRET environment variable is required');
  }
  return new TextEncoder().encode(secret);
}

const COOKIE_NAME = 'user_token';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface UserPayload {
  userId: number;
  email: string;
  nickname: string;
}

export async function createUserToken(user: UserPayload): Promise<string> {
  return new SignJWT({ userId: user.userId, email: user.email, nickname: user.nickname })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(getJWTSecret());
}

export async function verifyUserToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJWTSecret());
    return {
      userId: payload.userId as number,
      email: payload.email as string,
      nickname: payload.nickname as string,
    };
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
