import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../../../../components/Layout';
import { useAuthStore } from '../../../../../../store/auth';
import styles from '../../../../../../styles/CourseForm.module.css';
import LessonEditor, { AnyContentBlock, ContentBlockType, TextBlock } from '../../../../../../components/LessonEditor';

export default function EditLesson() {
  const router = useRouter();
  const { id: courseId, lessonId } = router.query;
  const { user, isLoading: authLoading } = useAuthStore();
  
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<AnyContentBlock[]>([]);
  const [order, setOrder] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
        const lesson = data.lesson;
        
        setTitle(lesson.title);
        setOrder(lesson.order);

        // Попытка загрузить структурированное содержимое
        let contentBlocks: AnyContentBlock[] = [];
        
        try {
          if (lesson.contentJson) {
            // Если есть структурированное содержимое в JSON, используем его
            contentBlocks = JSON.parse(lesson.contentJson);
          } else {
            // Иначе создаем простой текстовый блок из существующего содержимого
            contentBlocks = [
              {
                id: 'legacy-content',
                type: ContentBlockType.TEXT,
                order: 0,
                title: 'Содержимое урока',
                content: lesson.content || '',
              } as TextBlock,
            ];
          }
        } catch (e) {
          // В случае ошибки парсинга, создаем простой текстовый блок
          contentBlocks = [
            {
              id: 'legacy-content',
              type: ContentBlockType.TEXT,
              order: 0,
              title: 'Содержимое урока',
              content: lesson.content || '',
            } as TextBlock,
          ];
        }
        
        setBlocks(contentBlocks);
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
  }, [courseId, lessonId, user]);

  const handleLessonChange = (updatedBlocks: AnyContentBlock[]) => {
    setBlocks(updatedBlocks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Название урока обязательно');
      return;
    }

    if (!courseId || !lessonId) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Подготовка содержимого урока в формате JSON
      const contentJson = JSON.stringify(blocks);
      
      // Создание базового текста контента для совместимости с API
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

      const response = await fetch(`/api/teacher/courses/${courseId}/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          contentJson,
          order,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Не удалось обновить урок');
      }

      // Показываем сообщение об успешном сохранении
      alert('Урок успешно обновлен');
      
      // Перенаправляем на страницу редактирования курса
      router.push(`/teacher/courses/${courseId}`);
    } catch (error) {
      console.error('Error updating lesson:', error);
      setError((error as Error).message);
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
          <h1>Редактирование урока</h1>
          <button
            onClick={deleteLesson}
            className={styles.deleteButton}
            disabled={isSubmitting}
            type="button"
          >
            Удалить урок
          </button>
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
              {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}