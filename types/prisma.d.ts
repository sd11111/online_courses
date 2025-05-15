// Этот файл расширяет типы Prisma для добавления поля contentJson

import { Prisma } from '@prisma/client';

// Расширяем типы для Lesson
declare global {
  namespace PrismaNamespace {
    // Расширяем тип для создания урока
    interface LessonCreateInput extends Prisma.LessonCreateInput {
      contentJson?: string | Prisma.NullableStringFieldUpdateOperationsInput;
    }

    // Расширяем тип для обновления урока
    interface LessonUpdateInput extends Prisma.LessonUpdateInput {
      contentJson?: string | Prisma.NullableStringFieldUpdateOperationsInput;
    }

    // Расширяем тип для неконтролируемого создания урока
    interface LessonUncheckedCreateInput extends Prisma.LessonUncheckedCreateInput {
      contentJson?: string | Prisma.NullableStringFieldUpdateOperationsInput;
    }

    // Расширяем тип для неконтролируемого обновления урока
    interface LessonUncheckedUpdateInput extends Prisma.LessonUncheckedUpdateInput {
      contentJson?: string | Prisma.NullableStringFieldUpdateOperationsInput;
    }
  }
}

// Создаем расширенный тип PrismaClient с поддержкой нашего поля
export type ExtendedPrismaClient = Prisma.PrismaClient & {
  lesson: {
    create: (args: {
      data: PrismaNamespace.LessonCreateInput | PrismaNamespace.LessonUncheckedCreateInput;
      select?: Prisma.LessonSelect;
      include?: Prisma.LessonInclude;
    }) => Promise<any>;
    update: (args: {
      where: Prisma.LessonWhereUniqueInput;
      data: PrismaNamespace.LessonUpdateInput | PrismaNamespace.LessonUncheckedUpdateInput;
      select?: Prisma.LessonSelect;
      include?: Prisma.LessonInclude;
    }) => Promise<any>;
  };
};

// Функция для приведения обычного PrismaClient к ExtendedPrismaClient
export function extendPrismaClient(prisma: Prisma.PrismaClient): ExtendedPrismaClient {
  return prisma as unknown as ExtendedPrismaClient;
}