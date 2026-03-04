import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { initializeTokenCheck } from '../utils/backendAuth';
import SessionHandler from '../components/SessionHandler';
import '../styles/globals.css';

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  useEffect(() => {
    // Initialize token expiration checking
    initializeTokenCheck();
  }, []);

  return (
    <SessionProvider session={session}>
      <SessionHandler />
      <Component {...pageProps} />
    </SessionProvider>
  );
}
