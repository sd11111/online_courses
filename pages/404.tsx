import Link from 'next/link';
import Layout from '../components/Layout';
import styles from '../styles/Error.module.css';

export default function Custom404() {
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <h1 className={styles.errorCode}>404</h1>
          <h2 className={styles.errorTitle}>Страница не найдена</h2>
          <p className={styles.errorMessage}>
            Извините, но страница, которую вы ищете, не существует или была перемещена.
          </p>
          <div className={styles.actions}>
            <Link href="/" className={styles.homeButton}>
              Вернуться на главную
            </Link>
            <Link href="/courses" className={styles.coursesButton}>
              Перейти к курсам
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}