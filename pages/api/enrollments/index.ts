import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Проверяем, что пользователь авторизован
  const authResult = await authMiddleware(req, res);
  if (authResult) return authResult;

  const user = (req as any).user;

  if (req.method === 'POST') {
    try {
      const { courseId } = req.body;

      if (!courseId) {
        return res.status(400).json({ error: 'Course ID is required' });
      }

      // Проверяем существование курса
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Проверяем, не записан ли пользователь уже на этот курс
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId,
          },
        },
      });

      if (existingEnrollment) {
        return res.status(400).json({ error: 'You are already enrolled in this course' });
      }

      // Создаем запись о зачислении
      const enrollment = await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId,
          status: 'APPROVED', // Автоматически подтверждаем запись
        },
      });

      return res.status(201).json({ enrollment });
    } catch (error) {
      console.error('Error creating enrollment:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    try {
      // Получаем все записи на курсы для текущего пользователя
      const enrollments = await prisma.enrollment.findMany({
        where: {
          userId: user.id,
        },
        include: {
          course: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json({ enrollments });
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}