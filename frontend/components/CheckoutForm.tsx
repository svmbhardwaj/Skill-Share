import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

export default function CheckoutForm() {
    const stripe = useStripe();
    const elements = useElements();

    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return; // Stripe.js has not yet loaded.
        }

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Make sure to change this to the success page you want to redirect to
                return_url: `${window.location.origin}/my-jobs`,
            },
        });

        if (error) {
            setErrorMessage(error.message || 'An error occurred');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            <button disabled={!stripe} style={{ marginTop: '20px' }}>Submit Payment</button>
            {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}
        </form>
    );
}