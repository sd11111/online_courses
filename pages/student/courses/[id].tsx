import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { useAuthStore } from '../../../store/auth';
import styles from '../../../styles/StudentCourse.module.css';
import { AnyContentBlock, ContentBlockType } from '../../../components/LessonEditor';

// Типы данных
interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  createdAt: string;
  creator: {
    name: string;
  };
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  contentJson?: string | null;
  order: number;
  courseId: string;
  createdAt: string;
  updatedAt: string;
}

interface Enrollment {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export default function StudentCourseView() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isLoading: authLoading } = useAuthStore();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonContent, setLessonContent] = useState<AnyContentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Проверка роли пользователя
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'STUDENT')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Загрузка данных курса и уроков
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!id || !user) return;
      
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/student/courses/${id}`);
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить курс');
        }

        const data = await response.json();
        setCourse(data.course);
        setLessons(data.lessons);
        setEnrollment(data.enrollment);
        
        // Выбираем первый урок по умолчанию, если есть уроки
        if (data.lessons && data.lessons.length > 0) {
          setSelectedLesson(data.lessons[0]);
          loadLessonContent(data.lessons[0]);
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
        setError('Произошла ошибка при загрузке курса');
      } finally {
        setIsLoading(false);
      }
    };

    if (id && user) {
      fetchCourseData();
    }
  }, [id, user]);

  // Функция загрузки содержимого урока
  const loadLessonContent = (lesson: Lesson) => {
    if (!lesson) {
      setLessonContent([]);
      return;
    }

    try {
      // Попытка загрузить структурированное содержимое
      if (lesson.contentJson) {
        const contentBlocks = JSON.parse(lesson.contentJson);
        setLessonContent(contentBlocks);
      } else {
        // Если нет структурированного контента, создаем текстовый блок
        setLessonContent([
          {
            id: 'legacy-content',
            type: ContentBlockType.TEXT,
            order: 0,
            title: 'Содержимое урока',
            content: lesson.content || '',
          },
        ]);
      }
    } catch (error) {
      console.error('Error parsing lesson content:', error);
      // В случае ошибки создаем простой текстовый блок
      setLessonContent([
        {
          id: 'legacy-content',
          type: ContentBlockType.TEXT,
          order: 0,
          title: 'Содержимое урока',
          content: lesson.content || '',
        },
      ]);
    }
  };

  // Функция выбора урока
  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    loadLessonContent(lesson);
  };

  // Функция отметки курса как завершенного
  const markCourseAsCompleted = async () => {
    if (!id || !user) return;
    
    try {
      const response = await fetch(`/api/student/courses/${id}/complete`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Не удалось отметить курс как завершенный');
      }
      
      // Обновляем статус записи
      const data = await response.json();
      setEnrollment(data.enrollment);
      
      alert('Поздравляем! Вы успешно завершили курс!');
    } catch (error) {
      console.error('Error completing course:', error);
      setError('Произошла ошибка при отметке курса как завершенного');
    }
  };

  // Рендер содержимого блока в зависимости от его типа
  const renderContentBlock = (block: AnyContentBlock) => {
    switch (block.type) {
      case ContentBlockType.TEXT:
        return (
          <div key={block.id} className={styles.textBlock}>
            {block.title && <h3 className={styles.blockTitle}>{block.title}</h3>}
            <div className={styles.textContent}>
              {block.content.split('\n').map((paragraph: string, index: number) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        );
      
      case ContentBlockType.VIDEO:
        return (
          <div key={block.id} className={styles.videoBlock}>
            {block.title && <h3 className={styles.blockTitle}>{block.title}</h3>}
            {block.url && (
              <div className={styles.videoContainer}>
                <iframe
                  src={block.url}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={block.title || 'Видео'}
                />
              </div>
            )}
            {block.description && <p className={styles.videoDescription}>{block.description}</p>}
          </div>
        );
      
      case ContentBlockType.IMAGE:
        return (
          <div key={block.id} className={styles.imageBlock}>
            {block.title && <h3 className={styles.blockTitle}>{block.title}</h3>}
            {block.url && (
              <div className={styles.imageContainer}>
                <img src={block.url} alt={block.caption || block.title || 'Изображение'} />
              </div>
            )}
            {block.caption && <p className={styles.imageCaption}>{block.caption}</p>}
          </div>
        );
      
      case ContentBlockType.FILE:
        return (
          <div key={block.id} className={styles.fileBlock}>
            {block.title && <h3 className={styles.blockTitle}>{block.title}</h3>}
            <div className={styles.fileInfo}>
              <span className={styles.fileIcon}>📄</span>
              <a href={block.url} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                {block.fileName || 'Скачать файл'}
              </a>
              {block.fileSize && <span className={styles.fileSize}>{block.fileSize}</span>}
            </div>
          </div>
        );
      
      case ContentBlockType.EMBED:
        return (
          <div key={block.id} className={styles.embedBlock}>
            {block.title && <h3 className={styles.blockTitle}>{block.title}</h3>}
            <div 
              className={styles.embedContainer}
              dangerouslySetInnerHTML={{ __html: block.embedCode }}
            />
            {block.description && <p className={styles.embedDescription}>{block.description}</p>}
          </div>
        );
      
      case ContentBlockType.CODE:
        return (
          <div key={block.id} className={styles.codeBlock}>
            {block.title && <h3 className={styles.blockTitle}>{block.title}</h3>}
            <div className={styles.codeLanguage}>
              Язык: <span>{block.language}</span>
            </div>
            <pre className={styles.codeContent}>
              <code>{block.code}</code>
            </pre>
          </div>
        );
      
      case ContentBlockType.QUIZ:
        return (
          <div key={block.id} className={styles.quizBlock}>
            {block.title && <h3 className={styles.blockTitle}>{block.title}</h3>}
            <div className={styles.quizQuestions}>
              {block.questions.map((question: QuizQuestion, qIndex: number) => (
                <div key={question.id} className={styles.quizQuestion}>
                  <h4>{qIndex + 1}. {question.question}</h4>
                  <div className={styles.quizOptions}>
                    {question.options.map((option: string, oIndex: number) => (
                      <div key={oIndex} className={styles.quizOption}>
                        <input
                          type="radio"
                          id={`question-${question.id}-option-${oIndex}`}
                          name={`question-${question.id}`}
                          disabled={false}
                        />
                        <label htmlFor={`question-${question.id}-option-${oIndex}`}>
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case ContentBlockType.ASSIGNMENT:
        return (
          <div key={block.id} className={styles.assignmentBlock}>
            {block.title && <h3 className={styles.blockTitle}>{block.title}</h3>}
            <div className={styles.assignmentInstructions}>
              {block.instructions.split('\n').map((paragraph: string, index: number) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            {block.dueDate && (
              <div className={styles.assignmentDetails}>
                <span className={styles.assignmentDueDate}>
                  Срок сдачи: {new Date(block.dueDate).toLocaleDateString()}
                </span>
                {block.points && (
                  <span className={styles.assignmentPoints}>
                    Максимальная оценка: {block.points} баллов
                  </span>
                )}
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className={styles.loading}>Загрузка...</div>
      </Layout>
    );
  }

  if (!user || user.role !== 'STUDENT') {
    return null; // Router will redirect
  }

  if (error || !course || !enrollment) {
    return (
      <Layout>
        <div className={styles.error}>{error || 'Курс не найден или вы не записаны на него'}</div>
        <Link href="/student/dashboard" className={styles.backButton}>
          Вернуться на панель студента
        </Link>
      </Layout>
    );
  }

  // Проверяем, что пользователь имеет статус APPROVED или COMPLETED
  if (enrollment.status === 'PENDING') {
    return (
      <Layout>
        <div className={styles.container}>
          <div className={styles.pendingEnrollment}>
            <h1>{course.title}</h1>
            <div className={styles.pendingMessage}>
              <h2>Ваша заявка на записи находится на рассмотрении</h2>
              <p>Как только преподаватель подтвердит вашу заявку, вы получите доступ к материалам курса.</p>
              <p>Дата подачи заявки: {new Date(enrollment.createdAt).toLocaleDateString()}</p>
            </div>
            <Link href="/student/dashboard" className={styles.backButton}>
              Вернуться на панель студента
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.courseHeader}>
          <h1 className={styles.courseTitle}>{course.title}</h1>
          <div className={styles.courseDetails}>
            <span className={styles.courseTeacher}>Преподаватель: {course.creator.name}</span>
            {enrollment.status === 'COMPLETED' && (
              <span className={styles.completedBadge}>Курс завершен</span>
            )}
          </div>
        </div>

        <div className={styles.courseContent}>
          <div className={styles.lessonsSidebar}>
            <div className={styles.sidebarHeader}>
              <h2>Уроки курса</h2>
            </div>
            {lessons.length === 0 ? (
              <div className={styles.noLessons}>
                В курсе пока нет уроков
              </div>
            ) : (
              <div className={styles.lessonsList}>
                {lessons
                  .sort((a, b) => a.order - b.order)
                  .map((lesson) => (
                    <div 
                      key={lesson.id} 
                      className={`${styles.lessonItem} ${selectedLesson?.id === lesson.id ? styles.active : ''}`}
                      onClick={() => handleSelectLesson(lesson)}
                    >
                      <div className={styles.lessonOrder}>{lesson.order}</div>
                      <div className={styles.lessonTitle}>{lesson.title}</div>
                    </div>
                  ))}
              </div>
            )}

            {enrollment.status === 'APPROVED' && (
              <button
                onClick={markCourseAsCompleted}
                className={styles.completeButton}
              >
                Отметить курс как завершенный
              </button>
            )}

            <div className={styles.backLinkWrapper}>
              <Link href="/student/dashboard" className={styles.backLink}>
                Вернуться на панель студента
              </Link>
            </div>
          </div>

          <div className={styles.lessonContent}>
            {selectedLesson ? (
              <>
                <div className={styles.lessonHeader}>
                  <h2>{selectedLesson.title}</h2>
                </div>
                <div className={styles.lessonBlocks}>
                  {lessonContent.length > 0 ? (
                    lessonContent
                      .sort((a, b) => a.order - b.order)
                      .map(block => renderContentBlock(block))
                  ) : (
                    <div className={styles.emptyContent}>
                      <p>У этого урока пока нет содержимого.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.noLessonSelected}>
                <h2>Выберите урок из списка слева, чтобы начать обучение</h2>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}