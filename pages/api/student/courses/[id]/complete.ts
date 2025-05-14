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

  // POST запрос - отметка курса как завершенного
  if (req.method === 'POST') {
    try {
      // Проверяем, записан ли студент на курс и имеет ли статус APPROVED
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

      if (enrollment.status !== 'APPROVED') {
        return res.status(400).json({ 
          error: enrollment.status === 'PENDING' 
            ? 'Your enrollment is still pending' 
            : 'This course is already completed' 
        });
      }

      // Обновляем статус записи на COMPLETED
      const updatedEnrollment = await prisma.enrollment.update({
        where: {
          id: enrollment.id,
        },
        data: {
          status: 'COMPLETED',
        },
      });

      return res.status(200).json({
        enrollment: {
          ...updatedEnrollment,
          createdAt: updatedEnrollment.createdAt.toISOString(),
          updatedAt: updatedEnrollment.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Error completing course:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}