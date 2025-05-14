import type { NextPage } from 'next';
import Link from 'next/link';
import Layout from '../components/Layout';
import styles from '../styles/Home.module.css';

const Home: NextPage = () => {
  return (
    <Layout>
      <div className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1>Онлайн-образование для всех</h1>
            <p>
              Наша платформа предлагает качественные курсы от лучших преподавателей.
              Учитесь в своем темпе, в любое время и в любом месте.
            </p>
            <div className={styles.heroButtons}>
              <Link href="/courses" className={styles.primaryButton}>
                Найти курс
              </Link>
              <Link href="/register" className={styles.secondaryButton}>
                Начать обучение
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.features}>
          <h2>Преимущества нашей платформы</h2>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📚</div>
              <h3>Разнообразие курсов</h3>
              <p>Более 100 курсов по разным направлениям и уровням подготовки.</p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>👨‍🏫</div>
              <h3>Опытные преподаватели</h3>
              <p>Обучайтесь у профессионалов своего дела с многолетним опытом.</p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>⏱️</div>
              <h3>Гибкий график</h3>
              <p>Учитесь в удобное для вас время без привязки к расписанию.</p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎓</div>
              <h3>Сертификаты</h3>
              <p>Получайте подтверждение своих знаний и навыков по окончании обучения.</p>
            </div>
          </div>
        </section>

        <section className={styles.categories}>
          <h2>Популярные категории</h2>
          <div className={styles.categoryGrid}>
            <div className={styles.categoryCard}>
              <h3>Программирование</h3>
              <Link href="/courses?category=programming" className={styles.categoryLink}>
                Смотреть курсы
              </Link>
            </div>
            
            <div className={styles.categoryCard}>
              <h3>Дизайн</h3>
              <Link href="/courses?category=design" className={styles.categoryLink}>
                Смотреть курсы
              </Link>
            </div>
            
            <div className={styles.categoryCard}>
              <h3>Бизнес</h3>
              <Link href="/courses?category=business" className={styles.categoryLink}>
                Смотреть курсы
              </Link>
            </div>
            
            <div className={styles.categoryCard}>
              <h3>Маркетинг</h3>
              <Link href="/courses?category=marketing" className={styles.categoryLink}>
                Смотреть курсы
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.cta}>
          <h2>Готовы начать обучение?</h2>
          <p>Присоединяйтесь к тысячам студентов, которые уже повышают свои навыки на нашей платформе.</p>
          <Link href="/register" className={styles.primaryButton}>
            Зарегистрироваться бесплатно
          </Link>
        </section>
      </div>
    </Layout>
  );
};

export default Home;