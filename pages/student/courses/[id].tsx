import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { useAuthStore } from '../../../store/auth';
import styles from '../../../styles/StudentCourse.module.css';

// Типы данных
type Course = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  createdAt: string;
  creator: {
    name: string;
  };
};

type Lesson = {
  id: string;
  title: string;
  content: string;
  contentType: 'TEXT' | 'VIDEO' | 'IMAGE' | 'FILE' | 'EMBED';
  mediaUrl: string | null;
  order: number;
  courseId: string;
};

type Enrollment = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED';
  createdAt: string;
};

export default function StudentCourseView() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isLoading: authLoading } = useAuthStore();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
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

  // Функция выбора урока
  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
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
                <div className={styles.lessonText}>
                  {selectedLesson.content.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
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