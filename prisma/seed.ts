import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Создание администратора
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: 'admin123', // В реальном проекте должен быть хеш
      role: Role.ADMIN,
    },
  })

  // Создание преподавателя
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      email: 'teacher@example.com',
      name: 'Teacher User',
      password: 'teacher123', // В реальном проекте должен быть хеш
      role: Role.TEACHER,
    },
  })

  // Создание студента
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      name: 'Student User',
      password: 'student123', // В реальном проекте должен быть хеш
      role: Role.STUDENT,
    },
  })

  // Создание курса
  const course = await prisma.course.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      title: 'Введение в веб-разработку',
      description: 'Базовый курс для начинающих веб-разработчиков. Мы рассмотрим HTML, CSS и JavaScript.',
      price: 99.99,
      isPublished: true,
      creatorId: teacher.id,
    },
  })

  // Проверяем, существуют ли уже уроки
  const existingLessons = await prisma.lesson.findMany({
    where: { courseId: course.id },
  })

  // Создаем уроки только если их еще нет
  if (existingLessons.length === 0) {
    await prisma.lesson.createMany({
      data: [
        {
          title: 'Введение в HTML',
          content: 'HTML - основа всех веб-страниц. В этом уроке мы научимся основным тегам и структуре документа.',
          order: 1,
          courseId: course.id,
        },
        {
          title: 'Основы CSS',
          content: 'CSS позволяет стилизовать HTML. Мы изучим селекторы, свойства и значения.',
          order: 2,
          courseId: course.id,
        },
        {
          title: 'JavaScript для начинающих',
          content: 'JavaScript делает веб-страницы интерактивными. Изучим основы языка и DOM.',
          order: 3,
          courseId: course.id,
        },
      ],
    })
  }

  // Проверяем, существует ли уже запись на курс
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: student.id,
        courseId: course.id,
      },
    },
  })

  // Создаем запись на курс только если её еще нет
  if (!existingEnrollment) {
    await prisma.enrollment.create({
      data: {
        userId: student.id,
        courseId: course.id,
        status: 'APPROVED',
      },
    })
  }

  console.log('Данные успешно добавлены')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })