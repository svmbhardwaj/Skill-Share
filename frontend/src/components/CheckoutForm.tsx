import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import styles from '../styles/CheckoutForm.module.css';

interface CheckoutFormProps {
    clientSecret: string;
}

export default function CheckoutForm({ clientSecret }: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [succeeded, setSucceeded] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setError(null);

        const { error: submitError } = await elements.submit();
        if (submitError) {
            setError(submitError.message || 'An error occurred');
            setProcessing(false);
            return;
        }

        const { error: confirmError } = await stripe.confirmPayment({
            elements,
            clientSecret,
            confirmParams: {
                return_url: `${window.location.origin}/my-jobs?payment=success`,
            },
        });

        if (confirmError) {
            setError(confirmError.message || 'Payment failed');
            setProcessing(false);
        } else {
            setSucceeded(true);
            setProcessing(false);
        }
    };

    if (succeeded) {
        return (
            <div className={styles.successContainer}>
                <div className={styles.successIcon}>✓</div>
                <h3 className={styles.successTitle}>Payment Successful!</h3>
                <p className={styles.successText}>Your payment has been processed successfully.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <PaymentElement options={{ layout: 'tabs' }} />
            
            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}
            
            <button 
                type="submit" 
                disabled={!stripe || processing}
                className={styles.button}
            >
                {processing ? 'Processing...' : 'Pay Now'}
            </button>
        </form>
    );
}