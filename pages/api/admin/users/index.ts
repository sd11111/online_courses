import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Проверяем авторизацию и роль администратора
  const authResult = await authMiddleware(req, res, ['ADMIN']);
  if (authResult) return authResult;

  // GET запрос - получение всех пользователей
  if (req.method === 'GET') {
    try {
      const users = await prisma.user.findMany({
        orderBy: [
          {
            role: 'asc',
          },
          {
            createdAt: 'desc',
          },
        ],
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return res.status(200).json({
        users: users.map(user => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}