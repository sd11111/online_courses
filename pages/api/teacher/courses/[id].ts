import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Проверяем авторизацию и роль преподавателя
  const authResult = await authMiddleware(req, res, ['TEACHER']);
  if (authResult) return authResult;

  // Получаем пользователя из middleware
  const user = (req as any).user;
  
  // Получаем ID курса из URL
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid course ID' });
  }

  // Проверяем, что курс принадлежит преподавателю
  const course = await prisma.course.findUnique({
    where: { id },
    select: { creatorId: true },
  });

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  if (course.creatorId !== user.id) {
    return res.status(403).json({ error: 'You do not have permission to access this course' });
  }

  // GET запрос - получение данных курса
  if (req.method === 'GET') {
    try {
      const courseData = await prisma.course.findUnique({
        where: { id },
        include: {
          lessons: {
            orderBy: {
              order: 'asc',
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      });

      if (!courseData) {
        return res.status(404).json({ error: 'Course not found' });
      }

      return res.status(200).json({
        course: {
          ...courseData,
          createdAt: courseData.createdAt.toISOString(),
          updatedAt: courseData.updatedAt.toISOString(),
          lessons: courseData.lessons.map(lesson => ({
            ...lesson,
            createdAt: lesson.createdAt.toISOString(),
            updatedAt: lesson.updatedAt.toISOString(),
          })),
        },
      });
    } catch (error) {
      console.error('Error fetching course:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // PATCH запрос - обновление данных курса
  else if (req.method === 'PATCH') {
    try {
      const { title, description, price, imageUrl, isPublished } = req.body;
      
      const updateData: any = {};
      
      // Обновляем только те поля, которые пришли в запросе
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = price;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (isPublished !== undefined) updateData.isPublished = isPublished;
      
      // Если нет данных для обновления
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No data provided for update' });
      }
      
      const updatedCourse = await prisma.course.update({
        where: { id },
        data: updateData,
      });
      
      return res.status(200).json({
        course: {
          ...updatedCourse,
          createdAt: updatedCourse.createdAt.toISOString(),
          updatedAt: updatedCourse.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Error updating course:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // DELETE запрос - удаление курса
  else if (req.method === 'DELETE') {
    try {
      await prisma.course.delete({
        where: { id },
      });
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting course:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}