import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Role } from '@prisma/client';
import { authMiddleware } from '../../../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Проверяем авторизацию и роль администратора
  const authResult = await authMiddleware(req, res, ['ADMIN']);
  if (authResult) return authResult;

  // Получаем пользователя из middleware
  const admin = (req as any).user;
  
  // Получаем ID пользователя из URL
  const { id: userId } = req.query;
  
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  // Проверяем, существует ли пользователь
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Запрещаем администратору менять свою роль
  if (userId === admin.id) {
    return res.status(403).json({ error: 'You cannot change your own role' });
  }

  // PATCH запрос - обновление роли пользователя
  if (req.method === 'PATCH') {
    try {
      const { role } = req.body;
      
      // Проверяем, что роль является допустимым значением
      if (!role || !Object.values(Role).includes(role)) {
        return res.status(400).json({ error: 'Invalid role value' });
      }
      
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
      
      return res.status(200).json({
        user: {
          ...updatedUser,
          createdAt: updatedUser.createdAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}