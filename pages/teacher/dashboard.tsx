import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuthStore } from '../../store/auth';
import styles from '../../styles/TeacherDashboard.module.css';

// Типы данных
type Course = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  price: number;
  isPublished: boolean;
  createdAt: string;
  _count: {
    enrollments: number;
    lessons: number;
  };
};

export default function TeacherDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Проверка роли пользователя
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'TEACHER')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Загрузка курсов преподавателя
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/teacher/courses');
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить курсы');
        }

        const data = await response.json();
        setCourses(data.courses);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError('Произошла ошибка при загрузке курсов');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchCourses();
    }
  }, [user]);

  // Функция публикации/снятия с публикации курса
  const togglePublishCourse = async (courseId: string, isPublished: boolean) => {
    try {
      const response = await fetch(`/api/teacher/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished: !isPublished }),
      });
      
      if (!response.ok) {
        throw new Error('Не удалось обновить статус курса');
      }
      
      // Обновляем список курсов
      setCourses(courses.map(course => 
        course.id === courseId 
          ? { ...course, isPublished: !isPublished } 
          : course
      ));
    } catch (error) {
      console.error('Error updating course:', error);
      setError('Произошла ошибка при обновлении статуса курса');
    }
  };

  // Функция удаления курса
  const deleteCourse = async (courseId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот курс? Это действие нельзя отменить.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/teacher/courses/${courseId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Не удалось удалить курс');
      }
      
      // Удаляем курс из списка
      setCourses(courses.filter(course => course.id !== courseId));
    } catch (error) {
      console.error('Error deleting course:', error);
      setError('Произошла ошибка при удалении курса');
    }
  };

  if (authLoading) {
    return <div>Загрузка...</div>;
  }

  if (!user || user.role !== 'TEACHER') {
    return null; // Router will redirect
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Панель преподавателя</h1>
          <Link href="/teacher/courses/new" className={styles.createButton}>
            Создать новый курс
          </Link>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.statsContainer}>
          <div className={styles.statsCard}>
            <h3>Всего курсов</h3>
            <p className={styles.statValue}>{courses.length}</p>
          </div>
          <div className={styles.statsCard}>
            <h3>Опубликовано</h3>
            <p className={styles.statValue}>
              {courses.filter(course => course.isPublished).length}
            </p>
          </div>
          <div className={styles.statsCard}>
            <h3>Всего студентов</h3>
            <p className={styles.statValue}>
              {courses.reduce((acc, course) => acc + course._count.enrollments, 0)}
            </p>
          </div>
        </div>

        <h2>Ваши курсы</h2>

        {isLoading ? (
          <div className={styles.loading}>Загрузка курсов...</div>
        ) : courses.length === 0 ? (
          <div className={styles.emptyCourses}>
            <p>У вас пока нет созданных курсов.</p>
            <Link href="/teacher/courses/new" className={styles.createButton}>
              Создать первый курс
            </Link>
          </div>
        ) : (
          <div className={styles.coursesList}>
            <div className={styles.courseHeader}>
              <div className={styles.courseTitle}>Название</div>
              <div className={styles.courseStatus}>Статус</div>
              <div className={styles.courseLessons}>Уроки</div>
              <div className={styles.courseStudents}>Студенты</div>
              <div className={styles.coursePrice}>Цена</div>
              <div className={styles.courseActions}>Действия</div>
            </div>
            
            {courses.map((course) => (
              <div key={course.id} className={styles.courseRow}>
                <div className={styles.courseTitle}>
                  <Link href={`/teacher/courses/${course.id}`}>
                    {course.title}
                  </Link>
                </div>
                <div className={styles.courseStatus}>
                  <span className={course.isPublished ? styles.published : styles.draft}>
                    {course.isPublished ? 'Опубликован' : 'Черновик'}
                  </span>
                </div>
                <div className={styles.courseLessons}>
                  {course._count.lessons}
                </div>
                <div className={styles.courseStudents}>
                  {course._count.enrollments}
                </div>
                <div className={styles.coursePrice}>
                  {course.price > 0 ? `${course.price} руб.` : 'Бесплатно'}
                </div>
                <div className={styles.courseActions}>
                  <Link href={`/teacher/courses/${course.id}`} className={styles.editButton}>
                    Редактировать
                  </Link>
                  <button
                    onClick={() => togglePublishCourse(course.id, course.isPublished)}
                    className={course.isPublished ? styles.unpublishButton : styles.publishButton}
                  >
                    {course.isPublished ? 'Снять' : 'Опубликовать'}
                  </button>
                  <button
                    onClick={() => deleteCourse(course.id)}
                    className={styles.deleteButton}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}