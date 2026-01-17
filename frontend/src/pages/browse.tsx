import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Browse.module.css';
import Image from 'next/image';

// Define the Gig type
interface Gig {
    _id: string;
    title: string;
    description: string;
    imageUrl: string;
    provider: {
        name: string;
        verified: boolean;
    };
}

export default function BrowseGigs() {
    const [gigs, setGigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // --- THIS IS THE NEW DEFAULT LOCATION ---
        const defaultLocation = {
            latitude: 28.6139, // Coordinates for Delhi
            longitude: 77.2090,
        };

        const fetchGigs = async (lat: number, lon: number) => { 
            try {
                const radius = 20; // Increased radius for better testing
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/services?lat=${lat}&lon=${lon}&radius=${radius}`);
                const data = await res.json();
                
                if (data.success) {
                    setGigs(data.data);
                } else {
                    setError(data.error || 'Failed to fetch gigs.');
                }
            } catch {
                setError('An error occurred while fetching data.');
            } finally {
                setLoading(false);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                // Success: Use the user's live location
                (position) => {
                    fetchGigs(position.coords.latitude, position.coords.longitude);
                },
                // --- THIS IS THE MODIFIED PART ---
                // Error: Use the default location instead of just showing an error
                () => {
                    console.warn("Could not get live location. Falling back to default location.");
                    fetchGigs(defaultLocation.latitude, defaultLocation.longitude);
                }
            );
        } else {
            setError('Geolocation is not supported by your browser.');
            setLoading(false);
        }
    }, []);

    // The rest of your component's return statement (JSX) stays the same...
    return (
        <>
            <Head>
                <title>Browse Gigs | SkillShare</title>
                <meta name="description" content="Find trusted services offered by your community" />
            </Head>

            <main className={styles.main}>
                <h1 className={styles.heading}>
                    <span className={styles.white}>Explore </span>
                    <span className={styles.blue}>Gigs</span>
                </h1>
                <p className={styles.subtitle}>
                    Discover trusted local services — verified providers offering real skills near you.
                </p>

                {loading && <p>Loading nearby services...</p>}
                {error && <p className={styles.error}>{error}</p>}
                
                {!loading && !error && (
                    <div className={styles.grid}>
                        {gigs.length > 0 ? (
                           gigs.map((gig: Gig) => (
                            <div key={gig._id} className={styles.card}>
                                <Image
                                    src={gig.imageUrl}
                                    alt={gig.title}
                                    className={styles.image}
                                    width={100}
                                    height={100}
                                />
                                <div className={styles.info}>
                                    <h3 className={styles.title}>
                                        {gig.title}{' '}
                                        {gig.provider.verified && <span className={styles.badge}>✔ Verified</span>}
                                    </h3>
                                    <p className={styles.desc}>{gig.description}</p>
                                    <p className={styles.provider}>By {gig.provider.name}</p>
                                    
                                    {/* --- THIS IS THE EDITED PART --- */}
                                    <Link href={`/gigs/${gig._id}`}>
                                        <button className={styles.button}>View Details</button>
                                    </Link>
                                    {/* ------------------------------- */}
                        
                                </div>
                            </div>
                        ))
                        ) : (
                            <p>No services found near the default location.</p>
                        )}
                    </div>
                )}
            </main>
        </>
    );
}