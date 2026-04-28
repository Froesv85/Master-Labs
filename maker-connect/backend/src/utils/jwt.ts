const jwt: any = require('jsonwebtoken');

interface TokenPayload {
  userId: number;
  email: string;
  username: string;
}

interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: process.env.JWT_EXPIRY || '24h',
  });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret', {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  });
}

export function verifyToken(token: string): DecodedToken {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as DecodedToken;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function verifyRefreshToken(token: string): DecodedToken {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret') as DecodedToken;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch {
    return null;
  }
}
