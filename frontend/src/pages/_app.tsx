import type { AppProps } from 'next/app';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../components/Toast';
import Navbar from '../components/Navbar';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
            <AuthProvider>
                <ToastProvider>
                    <Navbar />
                    <Component {...pageProps} />
                </ToastProvider>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}