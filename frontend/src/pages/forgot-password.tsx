import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/AuthForm.module.css';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            
            if (data.success) {
                setSuccess('Password reset link sent! Check your email inbox.');
                setEmail('');
            } else {
                setError(data.error || 'Failed to send reset email.');
            }
        } catch {
            setError('Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head><title>Forgot Password | SkillShare</title></Head>
            <main className={styles.main}>
                <div className={styles.logo}>
                    <Link href="/">
                        <span className={styles.white}>Skill</span><span className={styles.blue}>Share</span><span className={styles.gold}>Local</span>
                    </Link>
                </div>
                <div className={styles.formCard}>
                    <h1 className={styles.title}>Forgot Password</h1>
                    <p className={styles.subtitle}>
                        Enter your email address and we&apos;ll send you a link to reset your password.
                    </p>
                    
                    {error && <p className={styles.error}>{error}</p>}
                    {success && <p className={styles.success}>{success}</p>}
                    
                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="email">Email Address</label>
                            <input 
                                id="email" 
                                type="email" 
                                className={styles.input} 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                placeholder="Enter your email"
                                required 
                            />
                        </div>
                        <button type="submit" className={styles.button} disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                    <p className={styles.switchLink}>
                        Remember your password? <Link href="/login">Back to Login</Link>
                    </p>
                </div>
            </main>
        </>
    );
}
