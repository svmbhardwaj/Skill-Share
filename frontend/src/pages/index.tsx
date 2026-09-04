import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
    return (
        <>
            <Head>
                <title>SkillShare - Your Local Services Marketplace</title>
                <meta name="description" content="Find trusted local help or share what you're good at. Connect with neighbors who offer real services." />
            </Head>

            <div className={styles.main}>
                {/* --- Hero --- */}
                <header className={styles.hero}>
                    <div className={styles.heroBadge}>
                        <span className={styles.liveDot} aria-hidden="true"></span>
                        Trusted help from your neighbors
                    </div>
                    <h1 className={styles.heading}>
                        Find trusted local help.<br />
                        <span className={styles.gradientText}>Share what you&apos;re good at.</span>
                    </h1>
                    <p className={styles.subtitle}>
                        SkillShare connects you with real people in your community — whether you
                        need a hand with something or you&apos;re the one who can help.
                    </p>
                    <div className={styles.actions}>
                        <Link href="/browse" className={`${styles.btn} ${styles.primary}`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                            Find a Service
                        </Link>
                        <Link href="/post-service" className={`${styles.btn} ${styles.secondary}`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            Offer a Service
                        </Link>
                    </div>
                </header>

                {/* --- How it works: the two journeys --- */}
                <section className={styles.journeys}>
                    <div className={styles.journeysHeader}>
                        <h2>How SkillShare works</h2>
                        <p>One marketplace, two sides — whatever you need, someone nearby may offer it.</p>
                    </div>

                    <div className={styles.journeyGrid}>
                        {/* Client journey */}
                        <article className={styles.journeyCard}>
                            <span className={styles.journeyTag}>For clients</span>
                            <h3>I need someone to help me.</h3>
                            <ol className={styles.journeySteps}>
                                <li><strong>Browse</strong> local services near you</li>
                                <li><strong>Request</strong> the service you need</li>
                                <li><strong>Pay</strong> securely once your request is accepted</li>
                                <li><strong>Track</strong> the job from start to finish</li>
                            </ol>
                            <Link href="/browse" className={`${styles.btn} ${styles.primary} ${styles.journeyCta}`}>
                                Find a Service
                            </Link>
                        </article>

                        {/* Provider journey */}
                        <article className={styles.journeyCard}>
                            <span className={`${styles.journeyTag} ${styles.journeyTagAlt}`}>For providers</span>
                            <h3>I can offer this service.</h3>
                            <ol className={styles.journeySteps}>
                                <li><strong>Offer</strong> a service you&apos;re good at</li>
                                <li><strong>Publish</strong> it to your local community</li>
                                <li><strong>Accept</strong> incoming requests on your terms</li>
                                <li><strong>Complete</strong> the job and get paid</li>
                            </ol>
                            <Link href="/post-service" className={`${styles.btn} ${styles.secondary} ${styles.journeyCta}`}>
                                Offer a Service
                            </Link>
                        </article>
                    </div>
                </section>

                {/* --- CTA --- */}
                <section className={styles.cta}>
                    <div className={styles.ctaContent}>
                        <h2>Good at something your neighbors need?</h2>
                        <p>Share your skills, set your own price, and help people right around the corner.</p>
                        <Link href="/post-service" className={`${styles.btn} ${styles.primary}`}>
                            Offer a Service
                        </Link>
                    </div>
                </section>

                {/* --- Footer --- */}
                <footer className={styles.footer}>
                    <div className={styles.footerContent}>
                        <div className={styles.footerBrand}>
                            <div className={styles.footerLogo}>
                                <span className={styles.white}>Skill</span>
                                <span className={styles.blue}>Share</span>
                            </div>
                            <p>Connecting local skills, building community.</p>
                        </div>
                        <div className={styles.footerLinks}>
                            <div className={styles.footerColumn}>
                                <h4>Platform</h4>
                                <Link href="/browse">Browse Services</Link>
                                <Link href="/post-service">Offer a Service</Link>
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