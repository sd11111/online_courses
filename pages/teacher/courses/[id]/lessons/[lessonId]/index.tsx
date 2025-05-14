import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Layout from '../../../../../../components/Layout';
import { useAuthStore } from '../../../../../../store/auth';
import styles from '../../../../../../styles/CourseForm.module.css';

// Типы данных
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
const lessonSchema = z.object({
  title: z.string().min(3, 'Название должно содержать не менее 3 символов'),
  content: z.string().min(20, 'Содержание должно содержать не менее 20 символов'),
  order: z.coerce.number().min(1, 'Порядок должен быть не менее 1').nonnegative('Порядок не может быть отрицательным')
});

type LessonFormData = z.infer<typeof lessonSchema>;

export default function EditLesson() {
  const router = useRouter();
  const { id: courseId, lessonId } = router.query;
  const { user, isLoading: authLoading } = useAuthStore();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<LessonFormData>({
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

  // Загрузка данных урока
  useEffect(() => {
    const fetchLesson = async () => {
      if (!courseId || !lessonId || !user) return;
      
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/teacher/courses/${courseId}/lessons/${lessonId}`);
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить урок');
        }

        const data = await response.json();
        setLesson(data.lesson);
        
        // Заполняем форму данными урока
        reset({
          title: data.lesson.title,
          content: data.lesson.content,
          order: data.lesson.order,
        });
      } catch (error) {
        console.error('Error fetching lesson:', error);
        setError('Произошла ошибка при загрузке урока');
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId && lessonId && user) {
      fetchLesson();
    }
  }, [courseId, lessonId, user, reset]);

  // Обработка отправки формы
  const onSubmit = async (data: LessonFormData) => {
    if (!courseId || !lessonId) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/teacher/courses/${courseId}/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Не удалось обновить урок');
      }

      // Обновляем данные урока
      setLesson(result.lesson);

      // Показываем сообщение об успешном сохранении
      alert('Урок успешно обновлен');
    } catch (error) {
      console.error('Error updating lesson:', error);
      setError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Функция удаления урока
  const deleteLesson = async () => {
    if (!courseId || !lessonId) return;
    
    if (!confirm('Вы уверены, что хотите удалить этот урок? Это действие нельзя отменить.')) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/teacher/courses/${courseId}/lessons/${lessonId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Не удалось удалить урок');
      }
      
      // Перенаправляем на страницу редактирования курса
      router.push(`/teacher/courses/${courseId}`);
    } catch (error) {
      console.error('Error deleting lesson:', error);
      setError((error as Error).message);
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return <div>Загрузка...</div>;
  }

  if (!user || user.role !== 'TEACHER') {
    return null; // Router will redirect
  }

  if (!lesson) {
    return (
      <Layout>
        <div>Урок не найден</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Редактирование урока</h1>
          <button
            onClick={deleteLesson}
            className={styles.deleteButton}
            disabled={isSubmitting}
          >
            Удалить урок
          </button>
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
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => router.push(`/teacher/courses/${courseId}`)}
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
      </div>
    </Layout>
  );
}