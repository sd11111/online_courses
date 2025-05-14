import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Проверяем авторизацию и роль студента
  const authResult = await authMiddleware(req, res, ['STUDENT']);
  if (authResult) return authResult;

  // Получаем пользователя из middleware
  const user = (req as any).user;

  // GET запрос - получение записей студента
  if (req.method === 'GET') {
    try {
      // Получаем все записи пользователя
      const enrollments = await prisma.enrollment.findMany({
        where: {
          userId: user.id,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              creator: {
                select: {
                  name: true,
                },
              },
              _count: {
                select: {
                  lessons: true,
                },
              },
            },
          },
        },
        orderBy: [
          {
            status: 'asc',
          },
          {
            createdAt: 'desc',
          },
        ],
      });

      return res.status(200).json({
        enrollments: enrollments.map(enrollment => ({
          ...enrollment,
          createdAt: enrollment.createdAt.toISOString(),
          updatedAt: enrollment.updatedAt.toISOString(),
        })),
      });
    } catch (error) {
      console.error('Error fetching student enrollments:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}