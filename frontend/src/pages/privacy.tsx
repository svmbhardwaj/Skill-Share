import Head from 'next/head';
import styles from '../styles/Legal.module.css';

export default function Privacy() {
    return (
        <>
            <Head>
                <title>Privacy Policy | SkillShare</title>
            </Head>
            <main className={styles.main}>
                <div className={styles.container}>
                    <h1 className={styles.title}>Privacy Policy</h1>
                    <p className={styles.lastUpdated}>Last updated: January 17, 2026</p>

                    <section className={styles.section}>
                        <h2>1. Introduction</h2>
                        <p>
                            Welcome to SkillShare. We respect your privacy and are committed to protecting your personal data. 
                            This privacy policy explains how we collect, use, and safeguard your information when you use our platform.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>2. Information We Collect</h2>
                        <p>We collect information you provide directly to us, including:</p>
                        <ul>
                            <li><strong>Account Information:</strong> Name, email address, and profile picture when you register or sign in with Google.</li>
                            <li><strong>Profile Information:</strong> Skills, bio, and other details you add to your profile.</li>
                            <li><strong>Service Information:</strong> Details about gigs and services you post or request.</li>
                            <li><strong>Location Data:</strong> Approximate location to show nearby services (only with your permission).</li>
                            <li><strong>Payment Information:</strong> Payment details processed securely through Stripe.</li>
                        </ul>
                    </section>

                    <section className={styles.section}>
                        <h2>3. How We Use Your Information</h2>
                        <p>We use the information we collect to:</p>
                        <ul>
                            <li>Provide, maintain, and improve our services</li>
                            <li>Process transactions and send related information</li>
                            <li>Connect service providers with clients</li>
                            <li>Send you technical notices and support messages</li>
                            <li>Respond to your comments and questions</li>
                            <li>Protect against fraudulent or illegal activity</li>
                        </ul>
                    </section>

                    <section className={styles.section}>
                        <h2>4. Information Sharing</h2>
                        <p>
                            We do not sell your personal information. We may share your information only in the following circumstances:
                        </p>
                        <ul>
                            <li>With other users as necessary to facilitate services (e.g., connecting clients with providers)</li>
                            <li>With service providers who assist in our operations (e.g., Stripe for payments)</li>
                            <li>If required by law or to protect our rights</li>
                        </ul>
                    </section>

                    <section className={styles.section}>
                        <h2>5. Data Security</h2>
                        <p>
                            We implement appropriate technical and organizational measures to protect your personal data against 
                            unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over 
                            the Internet is 100% secure.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>6. Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul>
                            <li>Access and receive a copy of your personal data</li>
                            <li>Rectify or update your personal data</li>
                            <li>Request deletion of your personal data</li>
                            <li>Withdraw consent at any time</li>
                        </ul>
                    </section>

                    <section className={styles.section}>
                        <h2>7. Third-Party Services</h2>
                        <p>
                            Our platform integrates with third-party services including Google (for authentication) and 
                            Stripe (for payments). These services have their own privacy policies, and we encourage you 
                            to review them.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>8. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at{' '}
                            <a href="mailto:support@skillshare.com">support@skillshare.com</a>
                        </p>
                    </section>
                </div>
            </main>
        </>
    );
}
