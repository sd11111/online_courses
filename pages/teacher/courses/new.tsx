import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Layout from '../../../components/Layout';
import { useAuthStore } from '../../../store/auth';
import styles from '../../../styles/CourseForm.module.css';

// Schema for form validation
const courseSchema = z.object({
  title: z.string().min(5, 'Название должно содержать не менее 5 символов'),
  description: z.string().min(20, 'Описание должно содержать не менее 20 символов'),
  price: z.coerce.number().min(0, 'Цена должна быть не менее 0').nonnegative('Цена не может быть отрицательной'),
  imageUrl: z.string().url('Введите корректный URL изображения').optional().or(z.literal('')),
});

type CourseFormData = z.infer<typeof courseSchema>;

export default function NewCourse() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      imageUrl: '',
    },
  });

  // Check user role
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'TEACHER')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Handle form submission
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
          title: data.title,
          description: data.description,
          price: data.price,
          imageUrl: data.imageUrl || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Не удалось создать курс');
      }

      // Redirect to the course edit page
      router.push(`/teacher/courses/${result.course.id}`);
    } catch (error) {
      console.error('Error creating course:', error);
      setError((error as Error).message);
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className={styles.loading}>Загрузка...</div>
      </Layout>
    );
  }

  if (!user || user.role !== 'TEACHER') {
    return null; // Router will redirect
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Создание нового курса</h1>
        </div>

        {error && <div className={styles.error}>{error}</div>}

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
      </div>
    </Layout>
  );
}