import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Layout from '../../../components/Layout';
import { useAuthStore } from '../../../store/auth';
import styles from '../../../../../styles/CourseForm.module.css';

// Типы контента
enum ContentType {
  TEXT = 'TEXT',
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  EMBED = 'EMBED',
}

// Схема валидации формы
const lessonSchema = z.object({
  title: z.string().min(3, 'Название должно содержать не менее 3 символов'),
  contentType: z.nativeEnum(ContentType),
  content: z.string().min(1, 'Содержание не может быть пустым'),
  mediaUrl: z.string().url('Введите корректный URL').optional().or(z.literal('')),
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
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: '',
      contentType: ContentType.TEXT,
      content: '',
      mediaUrl: '',
      order: 1,
    },
  });

  // Наблюдаем за выбранным типом контента
  const selectedContentType = watch('contentType');

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

  // Рендер полей в зависимости от выбранного типа контента
  const renderContentFields = () => {
    switch (selectedContentType) {
      case ContentType.TEXT:
        return (
          <div className={styles.formGroup}>
            <label htmlFor="content">Текстовое содержание урока*</label>
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
        );
      
      case ContentType.VIDEO:
        return (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="mediaUrl">URL видео*</label>
              <input
                id="mediaUrl"
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                {...register('mediaUrl')}
                className={styles.input}
              />
              {errors.mediaUrl && (
                <span className={styles.errorMessage}>{errors.mediaUrl.message}</span>
              )}
              <span className={styles.helperText}>
                Поддерживаются ссылки на YouTube, Vimeo и другие видеохостинги
              </span>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="content">Описание видео</label>
              <textarea
                id="content"
                placeholder="Введите описание видео или дополнительные материалы"
                {...register('content')}
                className={styles.textarea}
                rows={5}
              />
              {errors.content && (
                <span className={styles.errorMessage}>{errors.content.message}</span>
              )}
            </div>
          </>
        );
      
      case ContentType.IMAGE:
        return (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="mediaUrl">URL изображения*</label>
              <input
                id="mediaUrl"
                type="text"
                placeholder="https://example.com/image.jpg"
                {...register('mediaUrl')}
                className={styles.input}
              />
              {errors.mediaUrl && (
                <span className={styles.errorMessage}>{errors.mediaUrl.message}</span>
              )}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="content">Описание изображения</label>
              <textarea
                id="content"
                placeholder="Введите описание изображения или пояснения к нему"
                {...register('content')}
                className={styles.textarea}
                rows={5}
              />
              {errors.content && (
                <span className={styles.errorMessage}>{errors.content.message}</span>
              )}
            </div>
          </>
        );
      
      case ContentType.FILE:
        return (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="mediaUrl">URL файла*</label>
              <input
                id="mediaUrl"
                type="text"
                placeholder="https://example.com/document.pdf"
                {...register('mediaUrl')}
                className={styles.input}
              />
              {errors.mediaUrl && (
                <span className={styles.errorMessage}>{errors.mediaUrl.message}</span>
              )}
              <span className={styles.helperText}>
                Укажите ссылку на файл (PDF, DOCX, XLSX и т.д.)
              </span>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="content">Описание файла</label>
              <textarea
                id="content"
                placeholder="Введите описание файла или инструкции по его использованию"
                {...register('content')}
                className={styles.textarea}
                rows={5}
              />
              {errors.content && (
                <span className={styles.errorMessage}>{errors.content.message}</span>
              )}
            </div>
          </>
        );
      
      case ContentType.EMBED:
        return (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="mediaUrl">URL для встраивания*</label>
              <input
                id="mediaUrl"
                type="text"
                placeholder="https://example.com/embed"
                {...register('mediaUrl')}
                className={styles.input}
              />
              {errors.mediaUrl && (
                <span className={styles.errorMessage}>{errors.mediaUrl.message}</span>
              )}
              <span className={styles.helperText}>
                Укажите ссылку для встраивания внешнего контента (iframe)
              </span>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="content">HTML-код для встраивания*</label>
              <textarea
                id="content"
                placeholder="<iframe src='...'></iframe>"
                {...register('content')}
                className={styles.textarea}
                rows={5}
              />
              {errors.content && (
                <span className={styles.errorMessage}>{errors.content.message}</span>
              )}
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

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
              <label htmlFor="contentType">Тип контента*</label>
              <select
                id="contentType"
                {...register('contentType')}
                className={styles.select}
              >
                <option value={ContentType.TEXT}>Текст</option>
                <option value={ContentType.VIDEO}>Видео</option>
                <option value={ContentType.IMAGE}>Изображение</option>
                <option value={ContentType.FILE}>Файл</option>
                <option value={ContentType.EMBED}>Встраиваемый контент</option>
              </select>
            </div>

            {/* Динамические поля в зависимости от типа контента */}
            {renderContentFields()}

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