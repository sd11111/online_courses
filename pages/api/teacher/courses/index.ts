import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API: Teacher courses - method:', req.method);
  
  // Проверяем авторизацию и роль преподавателя
  try {
    const authResult = await authMiddleware(req, res, ['TEACHER']);
    if (authResult) return authResult;
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }

  // Получаем пользователя из middleware
  const user = (req as any).user;
  console.log('API: Teacher courses - authenticated user:', user?.id, user?.role);

  if (req.method === 'GET') {
    try {
      // Получаем все курсы преподавателя
      const courses = await prisma.course.findMany({
        where: {
          creatorId: user.id,
        },
        include: {
          _count: {
            select: {
              enrollments: true,
              lessons: true,
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
      console.error('Error fetching teacher courses:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      console.log('API: Creating new course, body:', req.body);
      const { title, description, price, imageUrl } = req.body;

      if (!title || !description) {
        return res.status(400).json({
          error: 'Название и описание курса обязательны',
        });
      }

      // Создаем новый курс
      const course = await prisma.course.create({
        data: {
          title,
          description,
          price: price || 0,
          imageUrl: imageUrl || null,
          creatorId: user.id,
        },
      });

      console.log('API: Course created successfully:', course.id);

      return res.status(201).json({
        course: {
          ...course,
          createdAt: course.createdAt.toISOString(),
          updatedAt: course.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Error creating course:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}