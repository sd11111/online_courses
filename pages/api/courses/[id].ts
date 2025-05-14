import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Получаем ID курса из URL
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid course ID' });
  }

  // GET запрос - получение данных курса
  if (req.method === 'GET') {
    try {
      // Находим курс и проверяем, что он опубликован
      const course = await prisma.course.findFirst({
        where: {
          id,
          isPublished: true,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          lessons: {
            select: {
              id: true,
              title: true,
              order: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
          _count: {
            select: {
              lessons: true,
              enrollments: true,
            },
          },
        },
      });

      if (!course) {
        return res.status(404).json({ error: 'Course not found or not published' });
      }

      // Получаем информацию о записи пользователя на курс, если он авторизован
      let enrollment = null;

      // Проверяем авторизацию без блокировки ответа
      try {
        // Проверяем авторизацию (без проверки роли)
        const authResult = await authMiddleware(req, res);
        
        // Если пользователь авторизован, проверяем его запись на курс
        if (!authResult) {
          const user = (req as any).user;

          enrollment = await prisma.enrollment.findUnique({
            where: {
              userId_courseId: {
                userId: user.id,
                courseId: id,
              },
            },
            select: {
              id: true,
              status: true,
              createdAt: true,
            },
          });
        }
      } catch (error) {
        console.error('Error checking enrollment:', error);
        // Не блокируем ответ, если ошибка авторизации
      }

      return res.status(200).json({
        course: {
          ...course,
          createdAt: course.createdAt.toISOString(),
          updatedAt: course.updatedAt.toISOString(),
        },
        enrollment: enrollment ? {
          ...enrollment,
          createdAt: enrollment.createdAt.toISOString(),
        } : null,
      });
    } catch (error) {
      console.error('Error fetching course:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}