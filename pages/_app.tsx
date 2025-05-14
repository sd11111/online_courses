import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useAuthStore } from '../store/auth';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  const { checkAuth, authChecked } = useAuthStore();

  // Проверяем авторизацию один раз при инициализации приложения
  useEffect(() => {
    if (!authChecked) {
      checkAuth();
    }
  }, [checkAuth, authChecked]);

  return <Component {...pageProps} />;
}

export default MyApp;