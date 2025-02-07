import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: number;
  email: string;
}

export function verifyToken(token: string): TokenPayload {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    console.log('Verifying token with secret:', process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
    console.log('Decoded token:', decoded);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid token');
  }
}

export function generateToken(payload: { id: number; email: string }): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
} 