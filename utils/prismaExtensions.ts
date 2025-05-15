// Создаем дополнительную типизацию для работы с Prisma

import { Prisma } from '@prisma/client';

// Расширяем типы Prisma для Lesson
export type LessonCreateInputWithContentJson = Prisma.LessonCreateInput & {
  contentJson?: string;
};

export type LessonUpdateInputWithContentJson = Prisma.LessonUpdateInput & {
  contentJson?: string;
};

// Функция для создания урока с поддержкой contentJson
export async function createLessonWithContentJson(
  prisma: Prisma.TransactionClient,
  data: LessonCreateInputWithContentJson
) {
  // Используем as any для обхода типизации
  return prisma.lesson.create({
    data: data as any,
  });
}

// Функция для обновления урока с поддержкой contentJson
export async function updateLessonWithContentJson(
  prisma: Prisma.TransactionClient,
  where: Prisma.LessonWhereUniqueInput,
  data: LessonUpdateInputWithContentJson
) {
  // Используем as any для обхода типизации
  return prisma.lesson.update({
    where,
    data: data as any,
  });
}