import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuthStore } from '../../store/auth';
import styles from '../../styles/StudentDashboard.module.css';

// Типы данных
type Enrollment = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED';
  createdAt: string;
  course: {
    id: string;
    title: string;
    imageUrl: string | null;
    creator: {
      name: string;
    };
    _count: {
      lessons: number;
    };
  };
};

export default function StudentDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Проверка роли пользователя
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'STUDENT')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Загрузка записей студента - мемоизируем функцию с useCallback
  const fetchEnrollments = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching enrollments...');
      const response = await fetch('/api/student/enrollments');
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить данные');
      }

      const data = await response.json();
      setEnrollments(data.enrollments);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setError('Произошла ошибка при загрузке данных');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Используем useEffect с правильными зависимостями
  useEffect(() => {
    // Загружаем данные только если пользователь аутентифицирован и не в процессе загрузки
    if (user && !authLoading) {
      fetchEnrollments();
    }
  }, [fetchEnrollments, authLoading, user]);

  // Отображаем состояние загрузки, пока аутентификация проверяется
  if (authLoading) {
    return <div>Проверка авторизации...</div>;
  }

  // Редирект будет обработан внутри первого useEffect
  if (!user || user.role !== 'STUDENT') {
    return <div>Перенаправление...</div>;
  }

  const approvedEnrollments = enrollments.filter(e => e.status === 'APPROVED');
  const pendingEnrollments = enrollments.filter(e => e.status === 'PENDING');
  const completedEnrollments = enrollments.filter(e => e.status === 'COMPLETED');

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Кабинет студента</h1>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <h3>Активные курсы</h3>
              <span className={styles.statValue}>{approvedEnrollments.length}</span>
            </div>
            <div className={styles.statCard}>
              <h3>Ожидают подтверждения</h3>
              <span className={styles.statValue}>{pendingEnrollments.length}</span>
            </div>
            <div className={styles.statCard}>
              <h3>Завершенные курсы</h3>
              <span className={styles.statValue}>{completedEnrollments.length}</span>
            </div>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {isLoading ? (
          <div className={styles.loading}>Загрузка курсов...</div>
        ) : (
          <>
            {approvedEnrollments.length > 0 && (
              <div className={styles.section}>
                <h2>Мои активные курсы</h2>
                <div className={styles.courseGrid}>
                  {approvedEnrollments.map((enrollment) => (
                    <div key={enrollment.id} className={styles.courseCard}>
                      <div className={styles.courseImage}>
                        {enrollment.course.imageUrl ? (
                          <img src={enrollment.course.imageUrl} alt={enrollment.course.title} />
                        ) : (
                          <div className={styles.placeholderImage}>📚</div>
                        )}
                      </div>
                      <div className={styles.courseContent}>
                        <h3 className={styles.courseTitle}>
                          <Link href={`/student/courses/${enrollment.course.id}`}>
                            {enrollment.course.title}
                          </Link>
                        </h3>
                        <p className={styles.courseTeacher}>
                          Преподаватель: {enrollment.course.creator.name}
                        </p>
                        <p className={styles.courseLessons}>
                          {enrollment.course._count.lessons} уроков
                        </p>
                        <Link href={`/student/courses/${enrollment.course.id}`} className={styles.continueButton}>
                          Продолжить обучение
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingEnrollments.length > 0 && (
              <div className={styles.section}>
                <h2>Заявки на рассмотрении</h2>
                <div className={styles.courseGrid}>
                  {pendingEnrollments.map((enrollment) => (
                    <div key={enrollment.id} className={styles.courseCard}>
                      <div className={styles.courseImage}>
                        {enrollment.course.imageUrl ? (
                          <img src={enrollment.course.imageUrl} alt={enrollment.course.title} />
                        ) : (
                          <div className={styles.placeholderImage}>📚</div>
                        )}
                      </div>
                      <div className={styles.courseContent}>
                        <h3 className={styles.courseTitle}>
                          <Link href={`/courses/${enrollment.course.id}`}>
                            {enrollment.course.title}
                          </Link>
                        </h3>
                        <p className={styles.courseTeacher}>
                          Преподаватель: {enrollment.course.creator.name}
                        </p>
                        <div className={styles.pendingBadge}>
                          Заявка на рассмотрении
                        </div>
                        <span className={styles.enrollDate}>
                          Подана: {new Date(enrollment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completedEnrollments.length > 0 && (
              <div className={styles.section}>
                <h2>Завершенные курсы</h2>
                <div className={styles.courseGrid}>
                  {completedEnrollments.map((enrollment) => (
                    <div key={enrollment.id} className={styles.courseCard}>
                      <div className={styles.courseImage}>
                        {enrollment.course.imageUrl ? (
                          <img src={enrollment.course.imageUrl} alt={enrollment.course.title} />
                        ) : (
                          <div className={styles.placeholderImage}>📚</div>
                        )}
                      </div>
                      <div className={styles.courseContent}>
                        <h3 className={styles.courseTitle}>
                          <Link href={`/student/courses/${enrollment.course.id}`}>
                            {enrollment.course.title}
                          </Link>
                        </h3>
                        <p className={styles.courseTeacher}>
                          Преподаватель: {enrollment.course.creator.name}
                        </p>
                        <div className={styles.completedBadge}>
                          Курс завершен
                        </div>
                        <Link href={`/student/courses/${enrollment.course.id}`} className={styles.reviewButton}>
                          Просмотреть материалы
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {enrollments.length === 0 && (
              <div className={styles.emptyState}>
                <h2>У вас пока нет курсов</h2>
                <p>Начните обучение прямо сейчас, выбрав курс из нашего каталога</p>
                <Link href="/courses" className={styles.browseCourses}>
                  Просмотреть каталог курсов
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}