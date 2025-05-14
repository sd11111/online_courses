import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Проверяем авторизацию и роль администратора
  const authResult = await authMiddleware(req, res, ['ADMIN']);
  if (authResult) return authResult;

  // GET запрос - получение всех курсов
  if (req.method === 'GET') {
    try {
      const courses = await prisma.course.findMany({
        include: {
          creator: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json({
        courses: courses.map(course => ({
          ...course,
          createdAt: course.createdAt.toISOString(),
          updatedAt: course.updatedAt.toISOString(),
        })),
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}