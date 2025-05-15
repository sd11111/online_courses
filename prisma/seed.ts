import { PrismaClient, Role } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid';
import { ContentBlockType } from '../components/LessonEditor';

const prisma = new PrismaClient()

// Создаем уникальные идентификаторы для блоков
const textBlockId1 = uuidv4();
const textBlockId2 = uuidv4();
const videoBlockId = uuidv4();
const imageBlockId = uuidv4();
const codeBlockId = uuidv4();
const quizBlockId = uuidv4();
const quizQuestion1Id = uuidv4();
const quizQuestion2Id = uuidv4();

async function main() {
  console.log('Начало сидирования базы данных...');

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
  });
  console.log('Создан администратор:', admin.name);

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
  });
  console.log('Создан преподаватель:', teacher.name);

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
  });
  console.log('Создан студент:', student.name);

  // Создание курса
  const course = await prisma.course.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      title: 'Введение в веб-разработку',
      description: 'Базовый курс для начинающих веб-разработчиков. Мы рассмотрим HTML, CSS и JavaScript, а также основы современных веб-технологий. Вы научитесь создавать интерактивные веб-сайты с нуля и поймете основные принципы работы современных фреймворков.',
      price: 99.99,
      isPublished: true,
      creatorId: teacher.id,
    },
  });
  console.log('Создан курс:', course.title);

  // Проверяем, существуют ли уже уроки
  const existingLessons = await prisma.lesson.findMany({
    where: { courseId: course.id },
    select: { id: true }
  });

  // Создаем уроки только если их еще нет
  if (existingLessons.length === 0) {
    // Создаем урок 1: Введение в HTML с различными типами блоков
    const lesson1ContentBlocks = [
      {
        id: textBlockId1,
        type: ContentBlockType.TEXT,
        order: 0,
        title: 'Что такое HTML?',
        content: 'HTML (HyperText Markup Language) - это стандартный язык разметки для создания веб-страниц. HTML описывает структуру веб-страницы с помощью различных элементов, таких как заголовки, параграфы, ссылки, изображения и т.д.\n\nВ этом уроке мы познакомимся с основными тегами HTML и научимся создавать простые веб-страницы.'
      },
      {
        id: videoBlockId,
        type: ContentBlockType.VIDEO,
        order: 1,
        title: 'Видео-урок по основам HTML',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        description: 'В этом видео разобраны основные принципы работы с HTML-тегами и структура HTML-документа.'
      },
      {
        id: imageBlockId,
        type: ContentBlockType.IMAGE,
        order: 2,
        title: 'Структура HTML-документа',
        url: 'https://www.w3schools.com/html/img_notepad.png',
        caption: 'Пример HTML-кода в редакторе'
      },
      {
        id: codeBlockId,
        type: ContentBlockType.CODE,
        order: 3,
        title: 'Базовый шаблон HTML-документа',
        language: 'html',
        code: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Моя первая веб-страница</title>\n  <meta charset="UTF-8">\n</head>\n<body>\n  <h1>Привет, мир!</h1>\n  <p>Это мой первый HTML-документ.</p>\n</body>\n</html>'
      }
    ];

    // Создаем урок 2: Основы CSS с текстом и различными примерами
    const lesson2ContentBlocks = [
      {
        id: textBlockId2,
        type: ContentBlockType.TEXT,
        order: 0,
        title: 'Введение в CSS',
        content: 'CSS (Cascading Style Sheets) - это язык стилей, который используется для описания внешнего вида документа, написанного с использованием HTML.\n\nС помощью CSS вы можете контролировать цвет текста, шрифты, расположение элементов, фоновые изображения и многое другое.'
      },
      {
        id: uuidv4(),
        type: ContentBlockType.CODE,
        order: 1,
        title: 'Пример CSS-стилей',
        language: 'css',
        code: 'body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n  background-color: #f5f5f5;\n}\n\nh1 {\n  color: #333;\n  text-align: center;\n}\n\np {\n  line-height: 1.6;\n  color: #666;\n}'
      },
      {
        id: uuidv4(),
        type: ContentBlockType.EMBED,
        order: 2,
        title: 'Интерактивный пример',
        embedCode: '<iframe src="https://jsfiddle.net/boilerplate/css/embedded/" style="width:100%; height:300px; border:0; border-radius: 4px; overflow:hidden;" title="CSS пример" allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media" sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>',
        description: 'Попробуйте изменить CSS-стили в этом интерактивном редакторе'
      }
    ];

    // Создаем урок 3: JavaScript для начинающих с тестом
    const lesson3ContentBlocks = [
      {
        id: uuidv4(),
        type: ContentBlockType.TEXT,
        order: 0,
        title: 'Что такое JavaScript?',
        content: 'JavaScript - это язык программирования, который позволяет создавать интерактивные веб-страницы. В отличие от HTML и CSS, JavaScript - это полноценный язык программирования, который может изменять содержимое страницы, обрабатывать события и взаимодействовать с пользователем.\n\nВ этом уроке мы изучим основы JavaScript и научимся добавлять интерактивность на веб-страницы.'
      },
      {
        id: uuidv4(),
        type: ContentBlockType.CODE,
        order: 1,
        title: 'Пример JavaScript-кода',
        language: 'javascript',
        code: '// Функция для вывода приветствия\nfunction sayHello() {\n  const name = document.getElementById("name").value;\n  alert("Привет, " + name + "!");\n}\n\n// Событие при нажатии кнопки\ndocument.getElementById("greetButton").addEventListener("click", sayHello);'
      },
      {
        id: quizBlockId,
        type: ContentBlockType.QUIZ,
        order: 2,
        title: 'Проверьте свои знания',
        questions: [
          {
            id: quizQuestion1Id,
            question: 'Как объявить переменную в JavaScript?',
            options: ['var myVar = 10;', 'variable myVar = 10;', 'v myVar = 10;', 'let myVar: number = 10;'],
            correctOptionIndex: 0
          },
          {
            id: quizQuestion2Id,
            question: 'Какой метод используется для вывода сообщения в консоль?',
            options: ['console.write()', 'console.log()', 'console.output()', 'console.print()'],
            correctOptionIndex: 1
          }
        ]
      },
      {
        id: uuidv4(),
        type: ContentBlockType.ASSIGNMENT,
        order: 3,
        title: 'Практическое задание',
        instructions: 'Создайте простую веб-страницу с кнопкой, при нажатии на которую меняется цвет фона страницы на случайный.\n\nИспользуйте JavaScript для обработки события клика и изменения стиля.',
        dueDate: '2025-06-01',
        points: 10
      }
    ];

    // Преобразуем блоки контента в текстовый формат для поля content
    const lesson1Content = lesson1ContentBlocks.map(block => {
      switch (block.type) {
        case ContentBlockType.TEXT:
          return block.content;
        case ContentBlockType.VIDEO:
          return `[VIDEO: ${block.url}]\n${block.description || ''}`;
        case ContentBlockType.IMAGE:
          return `[IMAGE: ${block.url}]\n${block.caption || ''}`;
        case ContentBlockType.CODE:
          return `[CODE: ${block.language}]\n${block.code || ''}`;
        default:
          return block.title || '';
      }
    }).join('\n\n');

    const lesson2Content = lesson2ContentBlocks.map(block => {
      switch (block.type) {
        case ContentBlockType.TEXT:
          return block.content;
        case ContentBlockType.CODE:
          return `[CODE: ${block.language}]\n${block.code || ''}`;
        case ContentBlockType.EMBED:
          return `[EMBED]\n${block.description || ''}`;
        default:
          return block.title || '';
      }
    }).join('\n\n');

    const lesson3Content = lesson3ContentBlocks.map(block => {
      switch (block.type) {
        case ContentBlockType.TEXT:
          return block.content;
        case ContentBlockType.CODE:
          return `[CODE: ${block.language}]\n${block.code || ''}`;
        case ContentBlockType.QUIZ:
          return `[QUIZ: ${block.questions?.length || 0} questions]`;
        case ContentBlockType.ASSIGNMENT:
          return `[ASSIGNMENT]\n${block.instructions || ''}`;
        default:
          return block.title || '';
      }
    }).join('\n\n');

    // Создаем уроки, используя обход типизации с as any
    await prisma.lesson.create({
      data: {
        title: 'Введение в HTML',
        content: lesson1Content,
        contentJson: JSON.stringify(lesson1ContentBlocks),
        order: 1,
        courseId: course.id,
      } as any,
    });
    console.log('Создан урок: Введение в HTML');
    
    await prisma.lesson.create({
      data: {
        title: 'Основы CSS',
        content: lesson2Content,
        contentJson: JSON.stringify(lesson2ContentBlocks),
        order: 2,
        courseId: course.id,
      } as any,
    });
    console.log('Создан урок: Основы CSS');
    
    await prisma.lesson.create({
      data: {
        title: 'JavaScript для начинающих',
        content: lesson3Content,
        contentJson: JSON.stringify(lesson3ContentBlocks),
        order: 3,
        courseId: course.id,
      } as any,
    });
    console.log('Создан урок: JavaScript для начинающих');
  } else {
    console.log('Уроки уже существуют, пропускаем создание');
  }

  // Проверяем, существует ли уже запись на курс
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: student.id,
        courseId: course.id,
      },
    },
  });

  // Создаем запись на курс только если её еще нет
  if (!existingEnrollment) {
    await prisma.enrollment.create({
      data: {
        userId: student.id,
        courseId: course.id,
        status: 'APPROVED',
      },
    });
    console.log('Создана запись студента на курс');
  } else {
    console.log('Запись на курс уже существует, пропускаем создание');
  }

  console.log('Данные успешно добавлены');
}

main()
  .catch((e) => {
    console.error('Ошибка при сидировании:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  })