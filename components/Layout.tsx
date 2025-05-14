import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '../store/auth';
import styles from '../styles/Layout.module.css';

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const { user, isLoading, logout, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Функция для определения активной ссылки
  const isActive = (path: string) => {
    return router.pathname === path ? styles.active : '';
  };

  if (isLoading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Link href="/">
            Онлайн Курсы
          </Link>
        </div>

        <nav className={styles.nav}>
          <ul>
            <li>
              <Link href="/" className={isActive('/')}>
                Главная
              </Link>
            </li>
            <li>
              <Link href="/courses" className={isActive('/courses')}>
                Каталог курсов
              </Link>
            </li>
            
            {user ? (
              <>
                {user.role === 'STUDENT' && (
                  <li>
                    <Link href="/student/dashboard" className={isActive('/student/dashboard')}>
                      Кабинет студента
                    </Link>
                  </li>
                )}
                
                {user.role === 'TEACHER' && (
                  <li>
                    <Link href="/teacher/dashboard" className={isActive('/teacher/dashboard')}>
                      Кабинет преподавателя
                    </Link>
                  </li>
                )}
                
                {user.role === 'ADMIN' && (
                  <li>
                    <Link href="/admin/dashboard" className={isActive('/admin/dashboard')}>
                      Панель администратора
                    </Link>
                  </li>
                )}
                
                <li>
                  <button onClick={handleLogout} className={styles.logoutButton}>
                    Выйти
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/login" className={isActive('/login')}>
                    Вход
                  </Link>
                </li>
                <li>
                  <Link href="/register" className={isActive('/register')}>
                    Регистрация
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Платформа Онлайн Курсов</p>
      </footer>
    </div>
  );
}