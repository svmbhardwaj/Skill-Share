import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../../styles/GigDetail.module.css'; // Import the new CSS file

// Define the Gig type
interface Gig {
    _id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    contactInfo: string;
    provider: {
        name: string;
        verified: boolean;
    };
}

export default function GigDetail() {
    const router = useRouter();
    const { id } = router.query;
    
    const [gig, setGig] = useState<Gig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            const fetchGigDetails = async () => {
                try {
                    const res = await fetch(`http://localhost:5000/api/services/${id}`);
                    const data = await res.json();
                    if (data.success) {
                        setGig(data.data);
                    } else {
                        setError(data.error || 'Failed to fetch gig details.');
                    }
                } catch (err) {
                    setError('An error occurred while fetching data.');
                } finally {
                    setLoading(false);
                }
            };
            fetchGigDetails();
        }
    }, [id]);

    const handleHire = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in to hire a provider.');
            router.push('/login');
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/jobs/hire', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ serviceId: id }),
            });
            const data = await res.json();
            if (data.success) {
                alert('Hire request sent successfully!');
                // Optionally, redirect to a "my jobs" page
                // router.push('/my-jobs');
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            alert('Failed to send hire request.');
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
    if (!gig) return <p>Gig not found.</p>;

    return (
        <>
            <Head>
                <title>{gig.title} | SkillShare Local</title>
            </Head>
            <main className={styles.main}>
                <div className={styles.card}>
                    <div className={styles.meta}>
                        <span className={styles.tag}>Category: {gig.category}</span>
                        <span className={styles.tag}>Price: ${gig.price}</span>
                    </div>
                    <h1 className={styles.title}>{gig.title}</h1>
                    <p className={styles.description}>{gig.description}</p>
                    
                    <hr className={styles.divider} />

                    <div className={styles.providerSection}>
                        <h3>Provider Details</h3>
                        <p><strong>Name:</strong> {gig.provider.name}</p>
                        <p><strong>Contact:</strong> {gig.contactInfo}</p>
                    </div>

                    <button className={styles.hireButton} onClick={handleHire}>
                        Hire {gig.provider.name}
                    </button>
                </div>
            </main>
        </>
    );
}