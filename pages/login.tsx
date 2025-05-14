import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../store/auth';
import Layout from '../components/Layout';
import styles from '../styles/Auth.module.css';

// Схема валидации формы
const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Пароль должен содержать не менее 6 символов'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const router = useRouter();
  const { user, login, error, isLoading } = useAuthStore();
  const [formError, setFormError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (user) {
      // Перенаправляем в зависимости от роли
      switch (user.role) {
        case 'ADMIN':
          router.push('/admin/dashboard');
          break;
        case 'TEACHER':
          router.push('/teacher/dashboard');
          break;
        case 'STUDENT':
          router.push('/student/dashboard');
          break;
        default:
          router.push('/');
      }
    }
  }, [user, router]);

  useEffect(() => {
    if (error) {
      setFormError(error);
    }
  }, [error]);

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    await login(data.email, data.password);
  };

  if (isLoading && user) {
    return <div>Загрузка...</div>;
  }

  return (
    <Layout>
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <h1>Вход</h1>
          {formError && <div className={styles.error}>{formError}</div>}
          
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={styles.input}
              />
              {errors.email && (
                <span className={styles.errorMessage}>{errors.email.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Пароль</label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className={styles.input}
              />
              {errors.password && (
                <span className={styles.errorMessage}>{errors.password.message}</span>
              )}
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? 'Загрузка...' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}