import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Layout from '../../../../components/Layout';
import { useAuthStore } from '../../../../store/auth';
import styles from '../../../../styles/CourseForm.module.css';
import tabStyles from '../../../../styles/CourseTabs.module.css';

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
  lessons: Lesson[];
  _count: {
    enrollments: number;
  };
};

type Lesson = {
  id: string;
  title: string;
  content: string;
  order: number;
  courseId: string;
  createdAt: string;
  updatedAt: string;
};

// Схема валидации формы
const courseSchema = z.object({
  title: z.string().min(5, 'Название должно содержать не менее 5 символов'),
  description: z.string().min(20, 'Описание должно содержать не менее 20 символов'),
  price: z.coerce.number().min(0, 'Цена должна быть не менее 0').nonnegative('Цена не может быть отрицательной'),
  imageUrl: z.string().url('Введите корректный URL изображения').optional().or(z.literal('')),
});

type CourseFormData = z.infer<typeof courseSchema>;

// Компонент страницы
export default function EditCourse() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isLoading: authLoading } = useAuthStore();
  
  console.log('Rendering EditCourse component, courseId:', id);
  console.log('User:', user);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' или 'lessons'
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      imageUrl: '',
    },
  });

  // Проверка роли пользователя
  useEffect(() => {
    console.log('Auth check effect running');
    console.log('User role:', user?.role);
    
    if (!authLoading && user) {
      if (user.role !== 'TEACHER') {
        console.log('User is not a teacher, redirecting to login');
        router.push('/login');
      } else {
        console.log('User is a teacher');
      }
    } else if (!authLoading && !user) {
      console.log('User not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Загрузка данных курса
  useEffect(() => {
    const fetchCourse = async () => {
      if (!id || !user) return;
      
      console.log('Fetching course data for ID:', id);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/teacher/courses/${id}`);
        
        if (!response.ok) {
          console.error('Error response:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('Error details:', errorText);
          throw new Error('Не удалось загрузить курс');
        }

        const data = await response.json();
        console.log('Course data received:', data.course);
        setCourse(data.course);
        
        // Заполняем форму данными курса
        reset({
          title: data.course.title,
          description: data.course.description,
          price: data.course.price,
          imageUrl: data.course.imageUrl || '',
        });
      } catch (error) {
        console.error('Error fetching course:', error);
        setError('Произошла ошибка при загрузке курса');
      } finally {
        setIsLoading(false);
      }
    };

    if (id && user) {
      fetchCourse();
    }
  }, [id, user, reset]);

  // Обработка отправки формы
  const onSubmit = async (data: CourseFormData) => {
    if (!id) return;
    
    console.log('Submitting form with data:', data);
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/teacher/courses/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          price: data.price,
          imageUrl: data.imageUrl || null,
        }),
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Не удалось обновить курс');
      }

      // Обновляем данные курса
      setCourse((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          title: data.title,
          description: data.description,
          price: data.price,
          imageUrl: data.imageUrl || null,
          updatedAt: new Date().toISOString(),
        };
      });

      // Показываем сообщение об успешном сохранении
      alert('Курс успешно обновлен');
    } catch (error) {
      console.error('Error updating course:', error);
      setError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Функция публикации/снятия с публикации курса
  const togglePublishCourse = async () => {
    if (!id || !course) return;
    
    console.log('Toggling publish status');
    try {
      const response = await fetch(`/api/teacher/courses/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished: !course.isPublished }),
      });
      
      if (!response.ok) {
        throw new Error('Не удалось обновить статус курса');
      }
      
      // Обновляем статус курса
      setCourse((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          isPublished: !prev.isPublished,
          updatedAt: new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('Error updating course:', error);
      setError('Произошла ошибка при обновлении статуса курса');
    }
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className={styles.loading}>Загрузка...</div>
      </Layout>
    );
  }

  if (!user || user.role !== 'TEACHER') {
    return (
      <Layout>
        <div className={styles.loading}>Перенаправление...</div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className={styles.error}>
          Курс не найден или у вас нет прав для его редактирования
          <button
            onClick={() => router.push('/teacher/dashboard')}
            className={styles.backButton}
            style={{ marginTop: '1rem', display: 'block' }}
          >
            Вернуться к панели преподавателя
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Редактирование курса</h1>
          <div>
            <button
              onClick={togglePublishCourse}
              className={course.isPublished ? styles.unpublishButton : styles.publishButton}
            >
              {course.isPublished ? 'Снять с публикации' : 'Опубликовать'}
            </button>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={tabStyles.tabs}>
          <button
            className={`${tabStyles.tab} ${activeTab === 'basic' ? tabStyles.active : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            Основная информация
          </button>
          <button
            className={`${tabStyles.tab} ${activeTab === 'lessons' ? tabStyles.active : ''}`}
            onClick={() => setActiveTab('lessons')}
          >
            Уроки ({course.lessons.length})
          </button>
        </div>

        {activeTab === 'basic' ? (
          <div className={styles.formCard}>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="title">Название курса*</label>
                <input
                  id="title"
                  type="text"
                  placeholder="Введите название курса"
                  {...register('title')}
                  className={styles.input}
                />
                {errors.title && (
                  <span className={styles.errorMessage}>{errors.title.message}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description">Описание курса*</label>
                <textarea
                  id="description"
                  placeholder="Введите подробное описание курса"
                  {...register('description')}
                  className={styles.textarea}
                  rows={6}
                />
                {errors.description && (
                  <span className={styles.errorMessage}>{errors.description.message}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="price">Цена (руб.)*</label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  {...register('price')}
                  className={styles.input}
                />
                {errors.price && (
                  <span className={styles.errorMessage}>{errors.price.message}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="imageUrl">URL изображения курса (опционально)</label>
                <input
                  id="imageUrl"
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  {...register('imageUrl')}
                  className={styles.input}
                />
                {errors.imageUrl && (
                  <span className={styles.errorMessage}>{errors.imageUrl.message}</span>
                )}
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => router.push('/teacher/dashboard')}
                  className={styles.cancelButton}
                  disabled={isSubmitting}
                >
                  Назад
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className={tabStyles.lessonsContainer}>
            <div className={tabStyles.lessonsHeader}>
              <h2>Уроки курса</h2>
              <button
                onClick={() => router.push(`/teacher/courses/${id}/lessons/new`)}
                className={tabStyles.addLessonButton}
              >
                Добавить урок
              </button>
            </div>

            {course.lessons.length === 0 ? (
              <div className={tabStyles.emptyLessons}>
                <p>У курса пока нет уроков.</p>
                <button
                  onClick={() => router.push(`/teacher/courses/${id}/lessons/new`)}
                  className={tabStyles.addLessonButton}
                >
                  Добавить первый урок
                </button>
              </div>
            ) : (
              <div className={tabStyles.lessonsList}>
                {course.lessons
                  .sort((a, b) => a.order - b.order)
                  .map((lesson) => (
                    <div key={lesson.id} className={tabStyles.lessonItem}>
                      <div className={tabStyles.lessonInfo}>
                        <div className={tabStyles.lessonOrder}>{lesson.order}</div>
                        <div className={tabStyles.lessonTitle}>{lesson.title}</div>
                      </div>
                      <div className={tabStyles.lessonActions}>
                        <button
                          onClick={() => router.push(`/teacher/courses/${id}/lessons/${lesson.id}`)}
                          className={tabStyles.editLessonButton}
                        >
                          Редактировать
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}