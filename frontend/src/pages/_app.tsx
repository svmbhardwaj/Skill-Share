import type { AppProps } from 'next/app';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import '../styles/globals.css';

// Replace with your Stripe publishable key from the .env file or directly
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'your_stripe_publishable_key_pk_...');

export default function App({ Component, pageProps }: AppProps) {
    return (
        <Elements stripe={stripePromise}>
            <Component {...pageProps} />
        </Elements>
    );
}