import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../../../components/Layout';
import { useAuthStore } from '../../../../../store/auth';
import styles from '../../../../../styles/CourseForm.module.css';
import LessonEditor, { AnyContentBlock, ContentBlockType } from '../../../../../components/LessonEditor';

export default function NewLesson() {
  const router = useRouter();
  const { id: courseId } = router.query;
  const { user, isLoading: authLoading } = useAuthStore();
  
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<AnyContentBlock[]>([]);
  const [order, setOrder] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
        
        setOrder(maxOrderValue + 1);
      } catch (error) {
        console.error('Error fetching course:', error);
        setError('Произошла ошибка при загрузке информации о курсе');
      }
    };

    if (courseId && user) {
      fetchCourse();
    }
  }, [courseId, user]);

  const handleLessonChange = (updatedBlocks: AnyContentBlock[]) => {
    setBlocks(updatedBlocks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Название урока обязательно');
      return;
    }

    if (!courseId) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Подготовка содержимого урока в формате JSON
      const contentJson = JSON.stringify(blocks);
      
      // Создание базового текста контента для API
      // Это упрощенное представление для совместимости с существующим API
      const content = blocks.map(block => {
        switch (block.type) {
          case ContentBlockType.TEXT:
            return block.content;
          case ContentBlockType.VIDEO:
            return `[VIDEO: ${block.url}]\n${block.description || ''}`;
          case ContentBlockType.IMAGE:
            return `[IMAGE: ${block.url}]\n${block.caption || ''}`;
          default:
            return block.title || '';
        }
      }).join('\n\n');

      const response = await fetch(`/api/teacher/courses/${courseId}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          contentJson, // Добавляем структурированный контент
          order,
        }),
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

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formCard}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Название урока*</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введите название урока"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="order">Порядок урока*</label>
              <input
                id="order"
                type="number"
                min="1"
                step="1"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value))}
                className={styles.input}
              />
              <p className={styles.helperText}>
                Определяет позицию урока в списке (чем меньше число, тем раньше отображается урок)
              </p>
            </div>
          </div>
          
          <div className={styles.editorSection}>
            <h2>Содержимое урока</h2>
            <div className={styles.editorContainer}>
              <LessonEditor
                initialBlocks={blocks}
                onChange={handleLessonChange}
              />
            </div>
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
    </Layout>
  );
}