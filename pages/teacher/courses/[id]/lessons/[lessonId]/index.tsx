import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../../../../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Проверяем авторизацию и роль преподавателя
  const authResult = await authMiddleware(req, res, ['TEACHER']);
  if (authResult) return authResult;

  // Получаем пользователя из middleware
  const user = (req as any).user;
  
  // Получаем ID курса и ID урока из URL
  const { id: courseId, lessonId } = req.query;
  
  if (!courseId || typeof courseId !== 'string' || !lessonId || typeof lessonId !== 'string') {
    return res.status(400).json({ error: 'Invalid course or lesson ID' });
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

  // Проверяем, что урок принадлежит курсу
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, courseId: true },
  });

  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  if (lesson.courseId !== courseId) {
    return res.status(403).json({ error: 'Lesson does not belong to this course' });
  }

  // GET запрос - получение данных урока
  if (req.method === 'GET') {
    try {
      const lessonData = await prisma.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!lessonData) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      return res.status(200).json({
        lesson: {
          ...lessonData,
          createdAt: lessonData.createdAt.toISOString(),
          updatedAt: lessonData.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Error fetching lesson:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // PATCH запрос - обновление данных урока
  else if (req.method === 'PATCH') {
    try {
      const { title, content, contentJson, order } = req.body;
      
      const updateData: any = {};
      
      // Обновляем только те поля, которые пришли в запросе
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (contentJson !== undefined) updateData.contentJson = contentJson;
      if (order !== undefined) updateData.order = Number(order);
      
      // Если нет данных для обновления
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No data provided for update' });
      }
      
      const updatedLesson = await prisma.lesson.update({
        where: { id: lessonId },
        data: updateData,
      });
      
      return res.status(200).json({
        lesson: {
          ...updatedLesson,
          createdAt: updatedLesson.createdAt.toISOString(),
          updatedAt: updatedLesson.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Error updating lesson:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // DELETE запрос - удаление урока
  else if (req.method === 'DELETE') {
    try {
      await prisma.lesson.delete({
        where: { id: lessonId },
      });
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting lesson:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}