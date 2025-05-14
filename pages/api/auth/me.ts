import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Проверяем авторизацию
  const authResult = await authMiddleware(req, res);
  if (authResult) return authResult; // Если authMiddleware вернул ответ

  try {
    const user = (req as any).user;

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Me handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}