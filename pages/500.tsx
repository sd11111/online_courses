import Link from 'next/link';
import Layout from '../components/Layout';
import styles from '../styles/Error.module.css';

export default function Custom500() {
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <h1 className={styles.errorCode}>500</h1>
          <h2 className={styles.errorTitle}>Внутренняя ошибка сервера</h2>
          <p className={styles.errorMessage}>
            Извините, на сервере произошла ошибка. Мы уже работаем над её устранением.
          </p>
          <div className={styles.actions}>
            <Link href="/" className={styles.homeButton}>
              Вернуться на главную
            </Link>
            <button 
              onClick={() => window.location.reload()} 
              className={styles.coursesButton}
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}