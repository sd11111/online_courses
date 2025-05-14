import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import styles from '../../styles/Courses.module.css';

// Типы данных
type Course = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  price: number;
  createdAt: string;
  creator: {
    name: string;
  };
};

const Courses = () => {
  const router = useRouter();
  const { category } = router.query;
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // В реальном API нужно будет передать query-параметры для фильтрации
        const response = await fetch('/api/courses');
        
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

    fetchCourses();
  }, [category]);

  // Фильтрация курсов по поисковому запросу
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>
          {category 
            ? `Курсы по категории "${category}"`
            : 'Все курсы'
          }
        </h1>

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Поиск курсов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {isLoading ? (
          <div className={styles.loading}>Загрузка курсов...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : filteredCourses.length === 0 ? (
          <div className={styles.noCourses}>
            {searchTerm 
              ? 'По вашему запросу ничего не найдено' 
              : 'Курсы отсутствуют'
            }
          </div>
        ) : (
          <div className={styles.courseGrid}>
            {filteredCourses.map((course) => (
              <div key={course.id} className={styles.courseCard}>
                <div className={styles.courseImage}>
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} />
                  ) : (
                    <div className={styles.placeholderImage}>
                      📚
                    </div>
                  )}
                </div>
                <div className={styles.courseContent}>
                  <h2 className={styles.courseTitle}>
                    <Link href={`/courses/${course.id}`}>
                      {course.title}
                    </Link>
                  </h2>
                  <p className={styles.courseInstructor}>
                    Преподаватель: {course.creator.name}
                  </p>
                  <p className={styles.courseDescription}>
                    {course.description.length > 100
                      ? `${course.description.substring(0, 100)}...`
                      : course.description}
                  </p>
                  <div className={styles.courseFooter}>
                    <span className={styles.coursePrice}>
                      {course.price > 0 ? `${course.price} руб.` : 'Бесплатно'}
                    </span>
                    <Link href={`/courses/${course.id}`} className={styles.courseButton}>
                      Подробнее
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Courses;