import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Layout from '../../../../../components/Layout';
import { useAuthStore } from '../../../../../store/auth';
import styles from '../../../../../styles/CourseForm.module.css';

// Схема валидации формы
const lessonSchema = z.object({
  title: z.string().min(3, 'Название должно содержать не менее 3 символов'),
  content: z.string().min(20, 'Содержание должно содержать не менее 20 символов'),
  order: z.coerce.number().min(1, 'Порядок должен быть не менее 1').nonnegative('Порядок не может быть отрицательным')
});

type LessonFormData = z.infer<typeof lessonSchema>;

export default function NewLesson() {
  const router = useRouter();
  const { id: courseId } = router.query;
  const { user, isLoading: authLoading } = useAuthStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxOrder, setMaxOrder] = useState(0);
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: '',
      content: '',
      order: 1,
    },
  });

  // Проверка роли пользователя
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'TEACHER')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Получение информации о максимальном порядке уроков
  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId || !user) return;
      
      try {
        const response = await fetch(`/api/teacher/courses/${courseId}`);
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить информацию о курсе');
        }

        const data = await response.json();
        
        // Находим максимальный порядок уроков
        const lessons = data.course.lessons || [];
        const maxOrderValue = lessons.length > 0
          ? Math.max(...lessons.map((lesson: any) => lesson.order))
          : 0;
        
        setMaxOrder(maxOrderValue);
        // Устанавливаем порядок следующего урока
        setValue('order', maxOrderValue + 1);
      } catch (error) {
        console.error('Error fetching course:', error);
        setError('Произошла ошибка при загрузке информации о курсе');
      }
    };

    if (courseId && user) {
      fetchCourse();
    }
  }, [courseId, user, setValue]);

  const onSubmit = async (data: LessonFormData) => {
    if (!courseId) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/teacher/courses/${courseId}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Не удалось создать урок');
      }

      // Перенаправляем на страницу редактирования курса
      router.push(`/teacher/courses/${courseId}`);
    } catch (error) {
      console.error('Error creating lesson:', error);
      setError((error as Error).message);
      setIsSubmitting(false);
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
          <h1>Создание нового урока</h1>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.formCard}>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Название урока*</label>
              <input
                id="title"
                type="text"
                placeholder="Введите название урока"
                {...register('title')}
                className={styles.input}
              />
              {errors.title && (
                <span className={styles.errorMessage}>{errors.title.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="content">Содержание урока*</label>
              <textarea
                id="content"
                placeholder="Введите содержание урока"
                {...register('content')}
                className={styles.textarea}
                rows={10}
              />
              {errors.content && (
                <span className={styles.errorMessage}>{errors.content.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="order">Порядок урока*</label>
              <input
                id="order"
                type="number"
                min="1"
                step="1"
                {...register('order')}
                className={styles.input}
              />
              {errors.order && (
                <span className={styles.errorMessage}>{errors.order.message}</span>
              )}
              <span className={styles.helperText}>
                Последний урок имеет порядок: {maxOrder}
              </span>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => router.push(`/teacher/courses/${courseId}`)}
                className={styles.cancelButton}
                disabled={isSubmitting}
              >
                Отмена
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Создание...' : 'Создать урок'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}