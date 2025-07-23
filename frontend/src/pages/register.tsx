import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/AuthForm.module.css';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await fetch('http://localhost:5000/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, email, password, lat: latitude, lon: longitude }),
                    });
                    const data = await res.json();
                    if (data.success) {
                        localStorage.setItem('token', data.token);
                        alert('Registration successful! You can now log in.');
                        router.push('/login');
                    } else {
                        setError(data.error || 'Registration failed.');
                    }
                } catch (err) {
                    setError('Could not connect to the server.');
                } finally {
                    setLoading(false);
                }
            },
            () => {
                setError('Please enable location services to register.');
                setLoading(false);
            }
        );
    };

    return (
        <>
            <Head><title>Register | SkillShare Local</title></Head>
            <main className={styles.main}>
                <div className={styles.logo}>
                    <Link href="/">
                        <span className={styles.white}>Skill</span><span className={styles.blue}>Share</span><span className={styles.gold}>Local</span>
                    </Link>
                </div>
                <div className={styles.formCard}>
                    <h1 className={styles.title}>Create Your Account</h1>
                    <form onSubmit={handleSubmit}>
                        {error && <p className={styles.error}>{error}</p>}
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="name">Name</label>
                            <input id="name" type="text" className={styles.input} value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="email">Email</label>
                            <input id="email" type="email" className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="password">Password</label>
                            <input id="password" type="password" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className={styles.button} disabled={loading}>
                            {loading ? 'Registering...' : 'Register'}
                        </button>
                    </form>
                    <p className={styles.switchLink}>
                        Already have an account? <Link href="/login">Login</Link>
                    </p>
                </div>
            </main>
        </>
    );
}