import type { AppProps } from 'next/app';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastProvider } from '../components/Toast';
import '../styles/globals.css';

// Replace with your Stripe publishable key from the .env file or directly
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function App({ Component, pageProps }: AppProps) {
    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
            <ToastProvider>
                <Elements stripe={stripePromise}>
                    <Component {...pageProps} />
                </Elements>
            </ToastProvider>
        </GoogleOAuthProvider>
    );
}