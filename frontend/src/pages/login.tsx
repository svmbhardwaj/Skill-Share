import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import styles from '../styles/AuthForm.module.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Traditional email/password login
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('token', data.token);
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
                router.push('/');
            } else {
                setError(data.error || 'Login failed.');
            }
        } catch {
            setError('Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    // Google OAuth login
    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: credentialResponse.credential }),
            });
            const data = await res.json();
            
            if (data.success) {
                localStorage.setItem('token', data.token);
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
                router.push('/');
            } else {
                setError(data.error || 'Google login failed.');
            }
        } catch {
            setError('Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google sign-in was unsuccessful. Please try again.');
    };

    return (
        <>
            <Head><title>Login | SkillShare</title></Head>
            <main className={styles.main}>
                <div className={styles.logo}>
                    <Link href="/">
                        <span className={styles.white}>Skill</span><span className={styles.blue}>Share</span><span className={styles.gold}>Local</span>
                    </Link>
                </div>
                <div className={styles.formCard}>
                    <h1 className={styles.title}>Welcome Back</h1>
                    
                    {error && <p className={styles.error}>{error}</p>}
                    
                    {/* Google Sign-In Button */}
                    <div className={styles.googleButtonWrapper}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="filled_black"
                            size="large"
                            width="100%"
                            text="signin_with"
                        />
                    </div>

                    <div className={styles.divider}>
                        <span>or continue with email</span>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="email">Email</label>
                            <input 
                                id="email" 
                                type="email" 
                                className={styles.input} 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="password">Password</label>
                            <div className={styles.passwordWrapper}>
                                <input 
                                    id="password" 
                                    type={showPassword ? 'text' : 'password'} 
                                    className={styles.input} 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    required 
                                />
                                <button 
                                    type="button" 
                                    className={styles.passwordToggle}
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                            <line x1="1" y1="1" x2="23" y2="23"/>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className={styles.forgotPasswordLink}>
                            <Link href="/forgot-password">Forgot Password?</Link>
                        </div>
                        <button type="submit" className={styles.button} disabled={loading}>
                            {loading ? 'Logging in...' : 'Login with Email'}
                        </button>
                    </form>
                    <p className={styles.switchLink}>
                        Don&apos;t have an account? <Link href="/register">Register</Link>
                    </p>
                </div>
            </main>
        </>
    );
}