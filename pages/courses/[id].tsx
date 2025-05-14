import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuthStore } from '../../store/auth';
import styles from '../../styles/CourseView.module.css';

// Типы данных
type Course = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  price: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
  };
  lessons: {
    id: string;
    title: string;
    order: number;
  }[];
  _count: {
    lessons: number;
    enrollments: number;
  };
};

type Enrollment = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED';
  createdAt: string;
};

export default function CourseView() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuthStore();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка данных курса
  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);

      try {
        console.log('Fetching course with ID:', id);
        const response = await fetch(`/api/courses/${id}`);
        
        if (!response.ok) {
          console.error('Error response:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('Error details:', errorText);
          throw new Error(`Не удалось загрузить курс: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Received course data:', data);
        setCourse(data.course);
        
        // Если пользователь авторизован, проверяем его запись на курс
        if (user) {
          setEnrollment(data.enrollment || null);
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        setError('Произошла ошибка при загрузке курса. Пожалуйста, попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCourse();
    }
  }, [id, user]);

  // Функция записи на курс
  const enrollCourse = async () => {
    if (!id || !user) {
      router.push('/login');
      return;
    }
    
    setIsEnrolling(true);
    setError(null);

    try {
      const response = await fetch(`/api/courses/${id}/enroll`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось записаться на курс');
      }

      setEnrollment(data.enrollment);
    } catch (error) {
      console.error('Error enrolling in course:', error);
      setError((error as Error).message);
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className={styles.loading}>Загрузка...</div>
      </Layout>
    );
  }

  if (error || !course) {
    return (
      <Layout>
        <div className={styles.error}>{error || 'Курс не найден'}</div>
        <Link href="/courses" className={styles.backButton}>
          Вернуться к списку курсов
        </Link>
      </Layout>
    );
  }

  // Функция для отображения статуса записи
  const renderEnrollmentStatus = () => {
    if (!user) {
      return (
        <div className={styles.enrollmentPrompt}>
          <p>Войдите в систему, чтобы записаться на курс</p>
          <button
            onClick={() => router.push('/login')}
            className={styles.loginButton}
          >
            Войти
          </button>
        </div>
      );
    }

    if (enrollment) {
      if (enrollment.status === 'PENDING') {
        return <div className={styles.statusPending}>Заявка на рассмотрении</div>;
      } else if (enrollment.status === 'APPROVED') {
        return (
          <div className={styles.statusApproved}>
            Вы записаны на курс
            <button
              onClick={() => router.push(`/student/courses/${course.id}`)}
              className={styles.startLearningButton}
            >
              Начать обучение
            </button>
          </div>
        );
      } else if (enrollment.status === 'COMPLETED') {
        return <div className={styles.statusCompleted}>Курс завершен</div>;
      }
    }

    return (
      <button
        onClick={enrollCourse}
        disabled={isEnrolling}
        className={styles.enrollButton}
      >
        {isEnrolling ? 'Отправка заявки...' : `Записаться за ${course.price} руб.`}
      </button>
    );
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.courseHeader}>
          <div className={styles.courseInfo}>
            <h1 className={styles.courseTitle}>{course.title}</h1>
            <div className={styles.courseDetails}>
              <div className={styles.courseAuthor}>
                <span>Преподаватель:</span> {course.creator.name}
              </div>
              <div className={styles.courseStats}>
                <div className={styles.courseStat}>
                  <span>{course._count.lessons}</span> уроков
                </div>
                <div className={styles.courseStat}>
                  <span>{course._count.enrollments}</span> студентов
                </div>
              </div>
            </div>
          </div>
          <div className={styles.courseActions}>
            {renderEnrollmentStatus()}
          </div>
        </div>

        <div className={styles.courseContent}>
          <div className={styles.courseMainContent}>
            <div className={styles.courseDescription}>
              <h2>О курсе</h2>
              <div className={styles.descriptionText}>
                {course.description}
              </div>
            </div>

            {course.lessons.length > 0 && (
              <div className={styles.courseLessons}>
                <h2>Программа курса</h2>
                <div className={styles.lessonsList}>
                  {course.lessons
                    .sort((a, b) => a.order - b.order)
                    .map((lesson) => (
                      <div key={lesson.id} className={styles.lessonItem}>
                        <div className={styles.lessonOrder}>{lesson.order}</div>
                        <div className={styles.lessonTitle}>{lesson.title}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.courseSidebar}>
            <div className={styles.courseCard}>
              <div className={styles.courseImage}>
                {course.imageUrl ? (
                  <img src={course.imageUrl} alt={course.title} />
                ) : (
                  <div className={styles.placeholderImage}>
                    📚
                  </div>
                )}
              </div>
              <div className={styles.coursePrice}>
                {course.price > 0 ? `${course.price} руб.` : 'Бесплатно'}
              </div>
              <div className={styles.sidebarActions}>
                {renderEnrollmentStatus()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}