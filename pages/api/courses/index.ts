import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET запрос - получение списка курсов
  if (req.method === 'GET') {
    try {
      // Получаем query-параметры
      const { category } = req.query;
      
      // Создаем объект для фильтрации
      const where = {
        isPublished: true,
        // В будущем здесь можно добавить фильтрацию по категории
        // category: category ? { name: category as string } : undefined,
      };

      // Получаем курсы
      const courses = await prisma.course.findMany({
        where,
        include: {
          creator: {
            select: {
              name: true,
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