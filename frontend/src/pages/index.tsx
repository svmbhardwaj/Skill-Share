import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<{ name: string; avatar?: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            // Fetch user info
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.name) setUser(data);
                })
                .catch(console.error);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUser(null);
        router.push('/');
    };

    return (
        <>
            <Head>
                <title>SkillShare - Your Community Marketplace</title>
                <meta name="description" content="Find trusted local skills or offer your own to the community." />
            </Head>

            <div className={styles.main}>
                <Navbar isLoggedIn={isLoggedIn} user={user} onLogout={handleLogout} />

                {/* --- Hero Section --- */}
                <header className={styles.hero}>
                    <div className={styles.heroBadge}>
                        <span className={styles.liveDot}></span>
                        1,200+ Active Providers
                    </div>
                    <h1 className={styles.heading}>
                        Your Community Marketplace<br />
                        for <span className={styles.gradientText}>Everyday Skills</span>
                    </h1>
                    <p className={styles.subtitle}>
                        From home repairs to tutoring, find trusted help from your neighbors,<br className={styles.desktopBreak} /> or earn by sharing your talents.
                    </p>
                    <div className={styles.actions}>
                        <Link href="/browse">
                            <button className={`${styles.btn} ${styles.primary}`}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                                </svg>
                                Find a Skill
                            </button>
                        </Link>
                        <Link href={isLoggedIn ? "/post-gig" : "/register"}>
                            <button className={`${styles.btn} ${styles.secondary}`}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Offer Your Skill
                            </button>
                        </Link>
                    </div>
                    
                    {/* Floating Elements */}
                    <div className={styles.floatingElements}>
                        <div className={`${styles.floatingCard} ${styles.float1}`}>
                            <span className={styles.floatingIcon}>🔧</span>
                            <span>Home Repairs</span>
                        </div>
                        <div className={`${styles.floatingCard} ${styles.float2}`}>
                            <span className={styles.floatingIcon}>📚</span>
                            <span>Tutoring</span>
                        </div>
                        <div className={`${styles.floatingCard} ${styles.float3}`}>
                            <span className={styles.floatingIcon}>🎨</span>
                            <span>Design</span>
                        </div>
                        <div className={`${styles.floatingCard} ${styles.float4}`}>
                            <span className={styles.floatingIcon}>💻</span>
                            <span>Tech Help</span>
                        </div>
                    </div>
                </header>
                
                {/* --- Stats Section --- */}
                <section className={styles.stats}>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber}>5,000+</span>
                        <span className={styles.statLabel}>Happy Customers</span>
                    </div>
                    <div className={styles.statDivider}></div>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber}>1,200+</span>
                        <span className={styles.statLabel}>Skilled Providers</span>
                    </div>
                    <div className={styles.statDivider}></div>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber}>98%</span>
                        <span className={styles.statLabel}>Satisfaction Rate</span>
                    </div>
                    <div className={styles.statDivider}></div>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber}>50+</span>
                        <span className={styles.statLabel}>Service Categories</span>
                    </div>
                </section>

                {/* --- Features Section --- */}
                <section className={styles.features}>
                    <h2>How It Works</h2>
                    <p className={styles.featuresSubtitle}>Getting started is easy - just three simple steps</p>
                    <div className={styles.featureGrid}>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIcon}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                                </svg>
                            </div>
                            <span className={styles.stepNumber}>01</span>
                            <h3>Find Your Expert</h3>
                            <p>Search for any service you need, offered by talented people in your local area.</p>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIcon}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <span className={styles.stepNumber}>02</span>
                            <h3>Hire with Confidence</h3>
                            <p>View profiles, check ratings, and book your chosen provider securely.</p>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIcon}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <span className={styles.stepNumber}>03</span>
                            <h3>Get It Done</h3>
                            <p>Your local expert gets the job done. Rate them to build a stronger community.</p>
                        </div>
                    </div>
                </section>

                {/* --- Testimonials Section --- */}
                <section className={styles.testimonials}>
                    <h2>What Our Community Says</h2>
                    <p className={styles.testimonialsSubtitle}>Real stories from real people</p>
                    <div className={styles.testimonialGrid}>
                        <div className={styles.testimonialCard}>
                            <div className={styles.testimonialStars}>★★★★★</div>
                            <p className={styles.testimonialText}>
                                "Found an amazing tutor for my daughter within hours. The whole process was seamless!"
                            </p>
                            <div className={styles.testimonialAuthor}>
                                <div className={styles.authorAvatar}>S</div>
                                <div>
                                    <span className={styles.authorName}>Sarah Mitchell</span>
                                    <span className={styles.authorRole}>Parent</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.testimonialCard}>
                            <div className={styles.testimonialStars}>★★★★★</div>
                            <p className={styles.testimonialText}>
                                "As a freelance designer, this platform helped me connect with local clients I never would have found otherwise."
                            </p>
                            <div className={styles.testimonialAuthor}>
                                <div className={styles.authorAvatar}>M</div>
                                <div>
                                    <span className={styles.authorName}>Mike Chen</span>
                                    <span className={styles.authorRole}>Graphic Designer</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.testimonialCard}>
                            <div className={styles.testimonialStars}>★★★★★</div>
                            <p className={styles.testimonialText}>
                                "Got my AC fixed same day! The handyman was professional and reasonably priced."
                            </p>
                            <div className={styles.testimonialAuthor}>
                                <div className={styles.authorAvatar}>J</div>
                                <div>
                                    <span className={styles.authorName}>James Wilson</span>
                                    <span className={styles.authorRole}>Homeowner</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- CTA Section --- */}
                <section className={styles.cta}>
                    <div className={styles.ctaContent}>
                        <h2>Ready to Get Started?</h2>
                        <p>Join thousands of people in your community exchanging skills every day.</p>
                        <div className={styles.ctaActions}>
                            <Link href="/register">
                                <button className={`${styles.btn} ${styles.primary}`}>Create Free Account</button>
                            </Link>
                            <Link href="/browse">
                                <button className={`${styles.btn} ${styles.ghost}`}>Explore Services</button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* --- Footer --- */}
                <footer className={styles.footer}>
                    <div className={styles.footerContent}>
                        <div className={styles.footerBrand}>
                            <div className={styles.footerLogo}>
                                <span className={styles.white}>Skill</span>
                                <span className={styles.blue}>Share</span>
                                <span className={styles.gold}>Local</span>
                            </div>
                            <p>Connecting skills, building communities.</p>
                        </div>
                        <div className={styles.footerLinks}>
                            <div className={styles.footerColumn}>
                                <h4>Platform</h4>
                                <Link href="/browse">Browse Gigs</Link>
                                <Link href="/post-gig">Post a Gig</Link>
                                <Link href="/my-jobs">My Jobs</Link>
                            </div>
                            <div className={styles.footerColumn}>
                                <h4>Account</h4>
                                <Link href="/login">Login</Link>
                                <Link href="/register">Register</Link>
                                <Link href="/profile">Profile</Link>
                            </div>
                        </div>
                    </div>
                    <div className={styles.footerBottom}>
                        <p>&copy; {new Date().getFullYear()} SkillShare. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </>
    );
}