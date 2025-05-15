import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../../../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Проверяем авторизацию и роль преподавателя
  const authResult = await authMiddleware(req, res, ['TEACHER']);
  if (authResult) return authResult;

  // Получаем пользователя из middleware
  const user = (req as any).user;
  
  // Получаем ID курса из URL
  const { id: courseId } = req.query;
  
  if (!courseId || typeof courseId !== 'string') {
    return res.status(400).json({ error: 'Invalid course ID' });
  }

  // Проверяем, что курс принадлежит преподавателю
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { creatorId: true },
  });

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  if (course.creatorId !== user.id) {
    return res.status(403).json({ error: 'You do not have permission to access this course' });
  }

  // POST запрос - создание нового урока
  if (req.method === 'POST') {
    try {
      const { title, content, contentJson, order } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      // Создаем новый урок с сохранением структурированного контента
      const lesson = await prisma.lesson.create({
        data: {
          title,
          content: content || '', // Базовое текстовое содержимое
          contentJson: contentJson, // Структурированное содержимое в формате JSON
          order: order ? parseInt(order) : 1,
          courseId,
        },
      });

      return res.status(201).json({
        lesson: {
          ...lesson,
          createdAt: lesson.createdAt.toISOString(),
          updatedAt: lesson.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Error creating lesson:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // GET запрос - получение списка уроков курса
  else if (req.method === 'GET') {
    try {
      const lessons = await prisma.lesson.findMany({
        where: {
          courseId,
        },
        orderBy: {
          order: 'asc',
        },
      });

      return res.status(200).json({
        lessons: lessons.map(lesson => ({
          ...lesson,
          createdAt: lesson.createdAt.toISOString(),
          updatedAt: lesson.updatedAt.toISOString(),
        })),
      });
    } catch (error) {
      console.error('Error fetching lessons:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}