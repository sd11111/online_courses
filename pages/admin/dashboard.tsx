import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuthStore } from '../../store/auth';
import styles from '../../styles/AdminDashboard.module.css';

// Типы данных
type User = {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  createdAt: string;
};

type Course = {
  id: string;
  title: string;
  isPublished: boolean;
  creator: {
    name: string;
  };
  _count: {
    enrollments: number;
  };
};

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('users'); // 'users' или 'courses'

  // Проверка роли пользователя
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Загрузка пользователей
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      
      setIsLoadingUsers(true);
      setError(null);

      try {
        const response = await fetch('/api/admin/users');
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить пользователей');
        }

        const data = await response.json();
        setUsers(data.users);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Произошла ошибка при загрузке пользователей');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    if (user && user.role === 'ADMIN') {
      fetchUsers();
    }
  }, [user]);

  // Загрузка курсов
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      
      setIsLoadingCourses(true);
      setError(null);

      try {
        const response = await fetch('/api/admin/courses');
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить курсы');
        }

        const data = await response.json();
        setCourses(data.courses);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError('Произошла ошибка при загрузке курсов');
      } finally {
        setIsLoadingCourses(false);
      }
    };

    if (user && user.role === 'ADMIN') {
      fetchCourses();
    }
  }, [user]);

  // Функция изменения роли пользователя
  const changeUserRole = async (userId: string, newRole: 'STUDENT' | 'TEACHER' | 'ADMIN') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });
      
      if (!response.ok) {
        throw new Error('Не удалось изменить роль пользователя');
      }
      
      // Обновляем список пользователей
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole } 
          : user
      ));
    } catch (error) {
      console.error('Error changing user role:', error);
      setError('Произошла ошибка при изменении роли пользователя');
    }
  };

  if (authLoading) {
    return <div>Загрузка...</div>;
  }

  if (!user || user.role !== 'ADMIN') {
    return null; // Router will redirect
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Панель администратора</h1>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <h3>Пользователи</h3>
              <span className={styles.statValue}>{users.length}</span>
            </div>
            <div className={styles.statCard}>
              <h3>Курсы</h3>
              <span className={styles.statValue}>{courses.length}</span>
            </div>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Пользователи
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'courses' ? styles.active : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            Курсы
          </button>
        </div>

        {activeTab === 'users' ? (
          <div className={styles.usersPanel}>
            {isLoadingUsers ? (
              <div className={styles.loading}>Загрузка пользователей...</div>
            ) : (
              <div className={styles.usersList}>
                <div className={styles.userHeader}>
                  <div className={styles.userName}>Имя</div>
                  <div className={styles.userEmail}>Email</div>
                  <div className={styles.userRole}>Роль</div>
                  <div className={styles.userCreated}>Дата регистрации</div>
                  <div className={styles.userActions}>Действия</div>
                </div>
                
                {users.map((user) => (
                  <div key={user.id} className={styles.userRow}>
                    <div className={styles.userName}>{user.name}</div>
                    <div className={styles.userEmail}>{user.email}</div>
                    <div className={styles.userRole}>
                      <span className={styles[`role-${user.role.toLowerCase()}`]}>
                        {user.role === 'STUDENT' ? 'Студент' : 
                         user.role === 'TEACHER' ? 'Преподаватель' : 'Администратор'}
                      </span>
                    </div>
                    <div className={styles.userCreated}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    <div className={styles.userActions}>
                      <select
                        value={user.role}
                        onChange={(e) => changeUserRole(user.id, e.target.value as 'STUDENT' | 'TEACHER' | 'ADMIN')}
                        className={styles.roleSelect}
                      >
                        <option value="STUDENT">Студент</option>
                        <option value="TEACHER">Преподаватель</option>
                        <option value="ADMIN">Администратор</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.coursesPanel}>
            {isLoadingCourses ? (
              <div className={styles.loading}>Загрузка курсов...</div>
            ) : (
              <div className={styles.coursesList}>
                <div className={styles.courseHeader}>
                  <div className={styles.courseTitle}>Название</div>
                  <div className={styles.courseCreator}>Автор</div>
                  <div className={styles.courseStatus}>Статус</div>
                  <div className={styles.courseStudents}>Студенты</div>
                  <div className={styles.courseActions}>Действия</div>
                </div>
                
                {courses.map((course) => (
                  <div key={course.id} className={styles.courseRow}>
                    <div className={styles.courseTitle}>
                      <Link href={`/courses/${course.id}`}>
                        {course.title}
                      </Link>
                    </div>
                    <div className={styles.courseCreator}>
                      {course.creator.name}
                    </div>
                    <div className={styles.courseStatus}>
                      <span className={course.isPublished ? styles.published : styles.draft}>
                        {course.isPublished ? 'Опубликован' : 'Черновик'}
                      </span>
                    </div>
                    <div className={styles.courseStudents}>
                      {course._count.enrollments}
                    </div>
                    <div className={styles.courseActions}>
                      <Link href={`/courses/${course.id}`} className={styles.viewButton}>
                        Просмотр
                      </Link>
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