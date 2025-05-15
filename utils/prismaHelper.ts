// Этот файл демонстрирует правильное использование полей contentJson с Prisma

import { PrismaClient } from '@prisma/client';
import { ContentBlockType } from '../components/LessonEditor';
import { extendPrismaClient } from '../types/prisma';

// Пример функции для создания урока с поддержкой contentJson
export async function createLessonWithContentJson(
  courseId: string,
  title: string,
  blocks: any[],
  order: number
) {
  // Создаем расширенный экземпляр Prisma
  const prisma = extendPrismaClient(new PrismaClient());
  
  try {
    // Подготовка контента в двух форматах
    const contentJson = JSON.stringify(blocks);
    
    // Создание базового текста контента
    const content = blocks.map(block => {
      switch (block.type) {
        case ContentBlockType.TEXT:
          return block.content;
        case ContentBlockType.VIDEO:
          return `[VIDEO: ${block.url}]\n${block.description || ''}`;
        case ContentBlockType.IMAGE:
          return `[IMAGE: ${block.url}]\n${block.caption || ''}`;
        case ContentBlockType.CODE:
          return `[CODE: ${block.language}]\n${block.code || ''}`;
        case ContentBlockType.QUIZ:
          return `[QUIZ: ${block.questions?.length || 0} questions]`;
        case ContentBlockType.ASSIGNMENT:
          return `[ASSIGNMENT]\n${block.instructions || ''}`;
        case ContentBlockType.EMBED:
          return `[EMBED]\n${block.description || ''}`;
        case ContentBlockType.FILE:
          return `[FILE: ${block.url}]\n${block.fileName || ''}`;
        default:
          return block.title || '';
      }
    }).join('\n\n');

    // Создаем урок с поддержкой contentJson
    const lesson = await prisma.lesson.create({
      data: {
        title,
        content,
        contentJson, // Теперь TypeScript не должен выдавать ошибку
        order,
        courseId,
      },
    });

    return lesson;
  } finally {
    await prisma.$disconnect();
  }
}

// Функция для обновления урока с поддержкой contentJson
export async function updateLessonWithContentJson(
  lessonId: string,
  title: string,
  blocks: any[],
  order: number
) {
  // Создаем расширенный экземпляр Prisma
  const prisma = extendPrismaClient(new PrismaClient());
  
  try {
    // Подготовка контента в двух форматах
    const contentJson = JSON.stringify(blocks);
    
    // Создание базового текста контента
    const content = blocks.map(block => {
      switch (block.type) {
        case ContentBlockType.TEXT:
          return block.content;
        case ContentBlockType.VIDEO:
          return `[VIDEO: ${block.url}]\n${block.description || ''}`;
        case ContentBlockType.IMAGE:
          return `[IMAGE: ${block.url}]\n${block.caption || ''}`;
        case ContentBlockType.CODE:
          return `[CODE: ${block.language}]\n${block.code || ''}`;
        case ContentBlockType.QUIZ:
          return `[QUIZ: ${block.questions?.length || 0} questions]`;
        case ContentBlockType.ASSIGNMENT:
          return `[ASSIGNMENT]\n${block.instructions || ''}`;
        case ContentBlockType.EMBED:
          return `[EMBED]\n${block.description || ''}`;
        case ContentBlockType.FILE:
          return `[FILE: ${block.url}]\n${block.fileName || ''}`;
        default:
          return block.title || '';
      }
    }).join('\n\n');

    // Обновляем урок с поддержкой contentJson
    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title,
        content,
        contentJson, // Теперь TypeScript не должен выдавать ошибку
        order,
      },
    });

    return lesson;
  } finally {
    await prisma.$disconnect();
  }
}

// Пример функции для чтения урока и парсинга его contentJson
export async function getLessonWithContentJson(lessonId: string) {
  const prisma = new PrismaClient();
  
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return null;
    }

    // Парсинг contentJson в структурированные блоки
    let blocks = [];
    if (lesson.contentJson) {
      try {
        blocks = JSON.parse(lesson.contentJson);
      } catch (e) {
        console.error('Ошибка при парсинге contentJson:', e);
        // Если JSON некорректный, создаем простой текстовый блок
        blocks = [{
          id: 'default-content',
          type: ContentBlockType.TEXT,
          order: 0,
          title: 'Содержимое урока',
          content: lesson.content || ''
        }];
      }
    } else {
      // Если нет JSON-данных, используем обычный контент
      blocks = [{
        id: 'default-content',
        type: ContentBlockType.TEXT,
        order: 0,
        title: 'Содержимое урока',
        content: lesson.content || ''
      }];
    }

    return {
      ...lesson,
      blocks,
    };
  } finally {
    await prisma.$disconnect();
  }
}