import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../../../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Проверяем авторизацию и роль студента
  const authResult = await authMiddleware(req, res, ['STUDENT']);
  if (authResult) return authResult;

  // Получаем пользователя из middleware
  const user = (req as any).user;
  
  // Получаем ID курса из URL
  const { id: courseId } = req.query;
  
  if (!courseId || typeof courseId !== 'string') {
    return res.status(400).json({ error: 'Invalid course ID' });
  }

  // GET запрос - получение данных курса для студента
  if (req.method === 'GET') {
    try {
      // Проверяем, записан ли студент на курс
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId,
          },
        },
      });

      if (!enrollment) {
        return res.status(403).json({ error: 'You are not enrolled in this course' });
      }

      // Получаем данные курса
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          createdAt: true,
          creator: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Получаем уроки курса
      const lessons = await prisma.lesson.findMany({
        where: { courseId },
        orderBy: { order: 'asc' },
      });

      return res.status(200).json({
        course: {
          ...course,
          createdAt: course.createdAt.toISOString(),
        },
        lessons: lessons.map(lesson => ({
          ...lesson,
          createdAt: lesson.createdAt.toISOString(),
          updatedAt: lesson.updatedAt.toISOString(),
        })),
        enrollment: {
          ...enrollment,
          createdAt: enrollment.createdAt.toISOString(),
          updatedAt: enrollment.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Error fetching course for student:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}