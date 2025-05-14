import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Layout from '../../../components/Layout';
import { useAuthStore } from '../../../store/auth';
import styles from '../../../styles/CourseForm.module.css';

// Типы контента урока
export enum ContentType {
  TEXT = 'TEXT',
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  EMBED = 'EMBED',
}

// Схемы валидации
const courseSchema = z.object({
  title: z.string().min(5, 'Название курса должно содержать не менее 5 символов'),
  description: z.string().min(20, 'Описание курса должно содержать не менее 20 символов'),
  price: z.coerce.number().min(0, 'Цена не может быть отрицательной').optional(),
  imageUrl: z.string().url('Введите корректный URL изображения').optional().or(z.literal('')),
  lessons: z.array(
    z.object({
      title: z.string().min(3, 'Название урока должно содержать не менее 3 символов'),
      contentType: z.nativeEnum(ContentType),
      content: z.string().min(1, 'Содержание не может быть пустым'),
      mediaUrl: z.string().url('Введите корректный URL').optional().or(z.literal('')),
      order: z.coerce.number().min(1, 'Порядок должен быть не менее 1'),
    })
  ).optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

export default function NewCoursePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  
  // Состояния
  const [activeTab, setActiveTab] = useState<'course-info' | 'lessons'>('course-info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Форма для курса
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      imageUrl: '',
      lessons: [],
    },
  });

  // Обработчик создания курса
  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/teacher/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          price: data.price || 0,
          imageUrl: data.imageUrl || null,
          lessons: data.lessons || [],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Не удалось создать курс');
      }

      // Переход на страницу курса
      router.push(`/teacher/courses/${result.course.id}`);
    } catch (error) {
      console.error('Error creating course:', error);
      setError((error as Error).message);
      setIsSubmitting(false);
    }
  };

  // Добавление урока
  const addLesson = () => {
    const currentLessons = watch('lessons') || [];
    const newLesson = {
      title: '',
      contentType: ContentType.TEXT,
      content: '',
      mediaUrl: '',
      order: currentLessons.length + 1,
    };

    setValue('lessons', [...currentLessons, newLesson]);
  };

  // Удаление урока
  const removeLesson = (index: number) => {
    const currentLessons = watch('lessons') || [];
    const updatedLessons = currentLessons.filter((_, i) => i !== index);
    
    // Обновляем порядок уроков
    const reorderedLessons = updatedLessons.map((lesson, idx) => ({
      ...lesson,
      order: idx + 1,
    }));

    setValue('lessons', reorderedLessons);
  };

  // Проверка роли пользователя
  if (authLoading || !user || user.role !== 'TEACHER') {
    return <div>Загрузка...</div>;
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Создание нового курса</h1>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.stepNavigation}>
          <button
            className={`${styles.stepItem} ${activeTab === 'course-info' ? styles.active : ''}`}
            onClick={() => setActiveTab('course-info')}
          >
            Основная информация
          </button>
          <button
            className={`${styles.stepItem} ${activeTab === 'lessons' ? styles.active : ''}`}
            onClick={() => setActiveTab('lessons')}
          >
            Уроки
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {activeTab === 'course-info' && (
            <div className={styles.formCard}>
              <div className={styles.formGroup}>
                <label htmlFor="title">Название курса*</label>
                <input
                  id="title"
                  type="text"
                  {...register('title')}
                  className={styles.input}
                  placeholder="Введите название курса"
                />
                {errors.title && (
                  <span className={styles.errorMessage}>
                    {errors.title.message}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description">Описание курса*</label>
                <textarea
                  id="description"
                  {...register('description')}
                  className={styles.textarea}
                  placeholder="Расскажите подробно о курсе"
                  rows={6}
                />
                {errors.description && (
                  <span className={styles.errorMessage}>
                    {errors.description.message}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="price">Цена курса (руб.)</label>
                <input
                  id="price"
                  type="number"
                  {...register('price')}
                  className={styles.input}
                  placeholder="0 (необязательно)"
                  min="0"
                  step="1"
                />
                {errors.price && (
                  <span className={styles.errorMessage}>
                    {errors.price.message}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="imageUrl">URL обложки курса</label>
                <input
                  id="imageUrl"
                  type="text"
                  {...register('imageUrl')}
                  className={styles.input}
                  placeholder="https://example.com/course-image.jpg (необязательно)"
                />
                {errors.imageUrl && (
                  <span className={styles.errorMessage}>
                    {errors.imageUrl.message}
                  </span>
                )}
              </div>
            </div>
          )}

          {activeTab === 'lessons' && (
            <div className={styles.formCard}>
              <div className={styles.lessonsList}>
                {watch('lessons')?.length === 0 ? (
                  <p className={styles.emptyLessons}>
                    У курса пока нет уроков. Добавьте первый!
                  </p>
                ) : (
                  watch('lessons')?.map((lesson, index) => (
                    <div key={index} className={styles.lessonItem}>
                      <div className={styles.lessonInfo}>
                        <span className={styles.lessonOrder}>{lesson.order}</span>
                        <span className={styles.lessonTitle}>
                          {lesson.title || 'Новый урок'}
                        </span>
                        <span className={styles.lessonType}>
                          {lesson.contentType === ContentType.TEXT ? 'Текст' :
                           lesson.contentType === ContentType.VIDEO ? 'Видео' :
                           lesson.contentType === ContentType.IMAGE ? 'Изображение' :
                           lesson.contentType === ContentType.FILE ? 'Файл' :
                           lesson.contentType === ContentType.EMBED ? 'Встраиваемый контент' : 
                           lesson.contentType}
                        </span>
                      </div>
                      <div className={styles.lessonActions}>
                        <button
                          type="button"
                          onClick={() => removeLesson(index)}
                          className={styles.deleteButton}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={addLesson}
                  className={styles.submitButton}
                >
                  Добавить урок
                </button>
              </div>
            </div>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => router.push('/teacher/dashboard')}
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
              {isSubmitting ? 'Создание...' : 'Создать курс'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}