import { PrismaClient, User, Role } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

// Типы данных для авторизации
export type Session = {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
  };
};

// Функция для проверки авторизации на API-эндпоинтах
export async function authMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedRoles: Role[] = []
) {
  // Проверяем наличие токена в cookies
  const userId = req.cookies.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Находим пользователя по ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Проверка на роль, если указаны разрешенные роли
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Добавляем пользователя в запрос
    (req as any).user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return null; // Продолжаем выполнение запроса
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Функция для авторизации пользователя
export async function loginUser(email: string, password: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.password !== password) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}