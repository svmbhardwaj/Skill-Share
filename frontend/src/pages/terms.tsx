import Head from 'next/head';
import styles from '../styles/Legal.module.css';

export default function Terms() {
    return (
        <>
            <Head>
                <title>Terms of Service | SkillShare</title>
            </Head>
            <main className={styles.main}>
                <div className={styles.container}>
                    <h1 className={styles.title}>Terms of Service</h1>
                    <p className={styles.lastUpdated}>Last updated: January 17, 2026</p>

                    <section className={styles.section}>
                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using SkillShare, you agree to be bound by these Terms of Service. 
                            If you do not agree to these terms, please do not use our platform.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>2. Description of Service</h2>
                        <p>
                            SkillShare is a platform that connects individuals who offer services (Providers) with 
                            individuals seeking services (Clients). We facilitate the connection but are not a party 
                            to any agreements between Providers and Clients.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>3. User Accounts</h2>
                        <p>To use certain features, you must create an account. You agree to:</p>
                        <ul>
                            <li>Provide accurate and complete information</li>
                            <li>Maintain the security of your account credentials</li>
                            <li>Notify us immediately of any unauthorized access</li>
                            <li>Be responsible for all activities under your account</li>
                        </ul>
                    </section>

                    <section className={styles.section}>
                        <h2>4. User Conduct</h2>
                        <p>You agree not to:</p>
                        <ul>
                            <li>Violate any applicable laws or regulations</li>
                            <li>Post false, misleading, or fraudulent content</li>
                            <li>Harass, abuse, or harm other users</li>
                            <li>Use the platform for any illegal purposes</li>
                            <li>Attempt to gain unauthorized access to our systems</li>
                            <li>Interfere with the proper functioning of the platform</li>
                        </ul>
                    </section>

                    <section className={styles.section}>
                        <h2>5. Services and Payments</h2>
                        <p>
                            <strong>For Providers:</strong> You are responsible for accurately describing your services, 
                            setting appropriate prices, and delivering services as promised.
                        </p>
                        <p>
                            <strong>For Clients:</strong> You agree to pay for services as agreed upon with the Provider. 
                            Payments are processed securely through Stripe.
                        </p>
                        <p>
                            SkillShare may charge service fees for transactions conducted through the platform.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>6. Content Ownership</h2>
                        <p>
                            You retain ownership of content you post on SkillShare. By posting content, you grant us a 
                            non-exclusive, worldwide license to use, display, and distribute your content in connection 
                            with our services.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>7. Disclaimer of Warranties</h2>
                        <p>
                            SkillShare is provided &quot;as is&quot; without warranties of any kind. We do not guarantee the quality, 
                            safety, or legality of services offered by Providers. Users interact with each other at their own risk.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>8. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by law, SkillShare shall not be liable for any indirect, 
                            incidental, special, consequential, or punitive damages arising from your use of the platform.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>9. Termination</h2>
                        <p>
                            We reserve the right to suspend or terminate your account at any time for violations of these 
                            terms or for any other reason at our discretion.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>10. Changes to Terms</h2>
                        <p>
                            We may modify these terms at any time. Continued use of the platform after changes constitutes 
                            acceptance of the new terms.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>11. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms of Service, please contact us at{' '}
                            <a href="mailto:support@skillshare.com">support@skillshare.com</a>
                        </p>
                    </section>
                </div>
            </main>
        </>
    );
}
