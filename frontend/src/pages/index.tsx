import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) setIsLoggedIn(true);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        router.push('/');
    };

    return (
        <>
            <Head>
                <title>SkillShare Local - Your Community Marketplace</title>
                <meta name="description" content="Find trusted local skills or offer your own to the community." />
            </Head>

            <div className={styles.main}>
                {/* --- Navigation Bar --- */}
                <nav className={styles.navbar}>
                    <div className={styles.logo}>
                        <Link href="/">
                            <span className={styles.white}>Skill</span>
                            <span className={styles.blue}>Share</span>
                            <span className={styles.gold}>Local</span>
                        </Link>
                    </div>
                    <div className={styles.navLinks}>
                        <Link href="/browse">Browse Gigs</Link>
                        {isLoggedIn ? (
                            <>
                                <Link href="/my-jobs">My Jobs</Link>
                                <Link href="/post-gig">Post a Gig</Link>
                                <button onClick={handleLogout}>Logout</button>
                            </>
                        ) : (
                            <>
                                <Link href="/login">Login</Link>
                                <Link href="/register">
                                    <button className={styles.registerBtn}>Register</button>
                                </Link>
                            </>
                        )}
                    </div>
                </nav>

                {/* --- Hero Section --- */}
                <header className={styles.hero}>
                    <h1 className={styles.heading}>
                        Your Community Marketplace for Everyday Skills
                    </h1>
                    <p className={styles.subtitle}>
                        From home repairs to tutoring, find trusted help from your neighbors, or earn by sharing your talents.
                    </p>
                    <div className={styles.actions}>
                        <Link href="/browse">
                            <button className={`${styles.btn} ${styles.primary}`}>Find a Skill</button>
                        </Link>
                        <Link href={isLoggedIn ? "/post-gig" : "/register"}>
                            <button className={`${styles.btn} ${styles.secondary}`}>Offer Your Skill</button>
                        </Link>
                    </div>
                    
                    {/* --- STICKER RE-ADDED HERE --- */}
                    <div className={styles.heroSticker}>
                        <Image
                            src="https://cdn-icons-png.flaticon.com/512/2904/2904958.png"
                            alt="Community Vibe"
                            width={100}
                            height={100}
                        />
                    </div>
                    {/* --------------------------- */}
                </header>
                
                {/* --- Features Section --- */}
                <section className={styles.features}>
                    <h2>How It Works</h2>
                    <div className={styles.featureGrid}>
                        <div className={styles.featureCard}>
                            <h3>1. Find Your Expert</h3>
                            <p>Search for any service you need, offered by talented people in your local area.</p>
                        </div>
                        <div className={styles.featureCard}>
                            <h3>2. Hire with Confidence</h3>
                            <p>View profiles, check ratings, and book your chosen provider securely with our cashless system.</p>
                        </div>
                        <div className={styles.featureCard}>
                            <h3>3. Get It Done</h3>
                            <p>Your local expert gets the job done. Rate them to help build a stronger community.</p>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}