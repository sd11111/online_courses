import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Проверяем авторизацию, только для роли STUDENT
  const authResult = await authMiddleware(req, res, ['STUDENT']);
  if (authResult) return authResult;

  // Получаем пользователя из middleware
  const user = (req as any).user;
  
  // Получаем ID курса из URL
  const { id: courseId } = req.query;
  
  if (!courseId || typeof courseId !== 'string') {
    return res.status(400).json({ error: 'Invalid course ID' });
  }

  // POST запрос - запись на курс
  if (req.method === 'POST') {
    try {
      // Проверяем, что курс существует и опубликован
      const course = await prisma.course.findUnique({
        where: {
          id: courseId,
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          price: true,
          creatorId: true,
        },
      });

      if (!course) {
        return res.status(404).json({ error: 'Course not found or not published' });
      }

      // Проверяем, что пользователь не является создателем курса
      if (course.creatorId === user.id) {
        return res.status(400).json({ error: 'You cannot enroll in your own course' });
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
        return res.status(400).json({
          error: 'You are already enrolled in this course',
          enrollment: {
            ...existingEnrollment,
            createdAt: existingEnrollment.createdAt.toISOString(),
            updatedAt: existingEnrollment.updatedAt.toISOString(),
          },
        });
      }

      // Создаем запись на курс
      // В реальном проекте здесь была бы логика оплаты
      const enrollment = await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId,
          // Если курс бесплатный, сразу одобряем запись
          status: course.price === 0 ? 'APPROVED' : 'PENDING',
        },
      });

      return res.status(201).json({
        enrollment: {
          ...enrollment,
          createdAt: enrollment.createdAt.toISOString(),
          updatedAt: enrollment.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Error enrolling in course:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}