import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

const CATEGORIES = ['Education', 'Repair', 'Health & Fitness', 'Tech Help', 'Other'];

export default function Home() {
    return (
        <>
            <Head>
                <title>SkillShare — Find trusted local help or share what you&apos;re good at</title>
                <meta name="description" content="A local services marketplace. Find trusted help nearby, or offer what you are good at. Request, pay, and review through one simple flow." />
            </Head>

            <div className={styles.main}>
                {/* ============ Hero ============ */}
                <header className={styles.hero}>
                    <div className={styles.heroInner}>
                        <p className={styles.heroBadge}>
                            <span className={styles.liveDot} aria-hidden="true" />
                            Your local services marketplace
                        </p>

                        <h1 className={styles.heroTitle}>
                            Find trusted local help.
                            <span className={styles.heroTitleAccent}>Share what you&apos;re good at.</span>
                        </h1>

                        <p className={styles.heroSubtitle}>
                            SkillShare connects you with real people in your community.
                            Need a hand with something, or want to offer what you do best?
                            Everything happens here — request, accept, pay, review.
                        </p>

                        <div className={styles.heroActions} aria-label="Get started">
                            <Link href="/browse" className={`${styles.btn} ${styles.btnPrimary}`}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                                </svg>
                                Find a Service
                            </Link>
                            <Link href="/post-service" className={`${styles.btn} ${styles.btnSecondary}`}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Offer a Service
                            </Link>
                        </div>

                        <ul className={styles.heroTrust} aria-label="How SkillShare works">
                            <li>No upfront fees</li>
                            <li>Pay only after your provider accepts</li>
                            <li>Ratings come from real, completed jobs</li>
                        </ul>
                    </div>
                </header>

                {/* ============ Two journeys ============ */}
                <section className={styles.journeys} aria-labelledby="how-it-works-title">
                    <div className={styles.sectionHeading}>
                        <p className={styles.eyebrow}>How it works</p>
                        <h2 id="how-it-works-title">One community, two sides</h2>
                        <p className={styles.sectionSub}>
                            Whatever you need, someone nearby may offer it — or that someone could be you.
                        </p>
                    </div>

                    <div className={styles.journeyGrid}>
                        {/* Client journey */}
                        <article className={`${styles.journeyCard} ${styles.journeyCardClient}`}>
                            <p className={styles.journeyTag}>For clients</p>
                            <h3 className={styles.journeyTitle}>I need someone to help me.</h3>
                            <ol className={styles.journeySteps}>
                                <li>
                                    <span className={styles.stepNum} aria-hidden="true">1</span>
                                    <span><strong>Browse</strong> services offered near you</span>
                                </li>
                                <li>
                                    <span className={styles.stepNum} aria-hidden="true">2</span>
                                    <span><strong>Request</strong> the service you need</span>
                                </li>
                                <li>
                                    <span className={styles.stepNum} aria-hidden="true">3</span>
                                    <span><strong>Pay</strong> securely once your request is accepted</span>
                                </li>
                                <li>
                                    <span className={styles.stepNum} aria-hidden="true">4</span>
                                    <span><strong>Track</strong> the job and review when it&apos;s done</span>
                                </li>
                            </ol>
                            <Link href="/browse" className={`${styles.btn} ${styles.btnPrimary}`}>
                                Find a Service
                            </Link>
                        </article>

                        {/* Provider journey */}
                        <article className={`${styles.journeyCard} ${styles.journeyCardProvider}`}>
                            <p className={`${styles.journeyTag} ${styles.journeyTagAlt}`}>For providers</p>
                            <h3 className={styles.journeyTitle}>I can offer this service.</h3>
                            <ol className={styles.journeySteps}>
                                <li>
                                    <span className={styles.stepNum} aria-hidden="true">1</span>
                                    <span><strong>Offer</strong> a service you&apos;re good at</span>
                                </li>
                                <li>
                                    <span className={styles.stepNum} aria-hidden="true">2</span>
                                    <span><strong>Publish</strong> it to your local community</span>
                                </li>
                                <li>
                                    <span className={styles.stepNum} aria-hidden="true">3</span>
                                    <span><strong>Accept</strong> incoming requests on your terms</span>
                                </li>
                                <li>
                                    <span className={styles.stepNum} aria-hidden="true">4</span>
                                    <span><strong>Complete</strong> the job and get paid</span>
                                </li>
                            </ol>
                            <Link href="/post-service" className={`${styles.btn} ${styles.btnSecondary}`}>
                                Offer a Service
                            </Link>
                        </article>
                    </div>
                </section>

                {/* ============ Popular categories ============ */}
                <section className={styles.categories} aria-labelledby="categories-title">
                    <div className={styles.sectionHeading}>
                        <p className={styles.eyebrow}>Explore</p>
                        <h2 id="categories-title">What do you need help with?</h2>
                        <p className={styles.sectionSub}>
                            Jump straight to the category you&apos;re looking for.
                        </p>
                    </div>
                    <div className={styles.categoryGrid}>
                        {CATEGORIES.map(cat => (
                            <Link
                                key={cat}
                                href={{ pathname: '/browse', query: { category: cat } }}
                                className={styles.categoryCard}
                            >
                                <span className={styles.categoryName}>{cat}</span>
                                <span className={styles.categoryArrow} aria-hidden="true">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                                    </svg>
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* ============ CTA band ============ */}
                <section className={styles.cta}>
                    <div className={styles.ctaInner}>
                        <h2 className={styles.ctaTitle}>Good at something your neighbours need?</h2>
                        <p className={styles.ctaText}>
                            Share your skill, set your own price, and help people right around the corner.
                        </p>
                        <Link href="/post-service" className={`${styles.btn} ${styles.btnOnDark}`}>
                            Offer a Service
                        </Link>
                    </div>
                </section>

                {/* ============ Footer ============ */}
                <footer className={styles.footer}>
                    <div className={styles.footerTop}>
                        <div className={styles.footerBrand}>
                            <Link href="/" className={styles.footerLogo}>
                                Skill<span className={styles.footerLogoAccent}>Share</span>
                            </Link>
                            <p className={styles.footerTagline}>
                                Connecting local skills and building community, one neighbourhood at a time.
                            </p>
                        </div>
                        <div className={styles.footerColumns}>
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
                            <div className={styles.footerColumn}>
                                <h4>Legal</h4>
                                <Link href="/terms">Terms of Service</Link>
                                <Link href="/privacy">Privacy Policy</Link>
                            </div>
                        </div>
                    </div>
                    <div className={styles.footerBottom}>
                        <p>&copy; {new Date().getFullYear()} SkillShare. Made for local communities.</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
