// frontend/src/pages/MyGigs.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import * as jsonwebtoken from 'jsonwebtoken';
import Navbar from '../components/Navbar';
import styles from '../styles/MyGigs.module.css';

// TypeScript Interfaces (ensure these match your backend data structure)
interface UserReference {
    _id: string;
    name: string;
    email: string;
}

interface Gig {
    _id: string;
    title: string;
    description: string;
    category: string;
    location: {
        type: string;
        coordinates: [number, number]; // [longitude, latitude]
        address?: string;
    };
    postedBy: UserReference; // Populate this from backend if needed, or just use _id
    createdAt: string;
}

interface ServiceResponse {
    _id: string;
    title: string;
    description: string;
    category: string;
    location?: {
        address?: string;
    };
    provider: UserReference;
    createdAt: string;
}

export default function MyGigs() {
    const router = useRouter();
    const [myGigs, setMyGigs] = useState<Gig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const decodedPayload: string | object | null = jsonwebtoken.decode(token);
            if (!(typeof decodedPayload === 'object' && decodedPayload !== null && 'id' in decodedPayload)) {
                throw new Error('Invalid token payload structure or missing ID.');
            }
        } catch (e) {
            console.error('Error decoding token:', e);
            router.push('/login');
            return;
        }

        const fetchMyGigs = async () => {
            setLoading(true);
            setError('');
            try {
                // Fetch user's services from the services endpoint
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/services/my`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Failed to fetch gigs.');
                }

                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    // Map service data to gig format
                    const mappedGigs = data.data.map((service: ServiceResponse) => ({
                        _id: service._id,
                        title: service.title,
                        description: service.description,
                        category: service.category,
                        location: service.location || { address: 'Not specified' },
                        postedBy: service.provider,
                        createdAt: service.createdAt,
                    }));
                    setMyGigs(mappedGigs);
                } else {
                    setError(data.error || 'Failed to fetch gigs.');
                }
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred while fetching your gigs.');
                }
            } finally {
                setLoading(false);
            }
        };

        // Fetch gigs when we have the token
        fetchMyGigs();

    }, [router]); // Only depend on router


    const handleDeleteGig = async (gigId: string) => {
        if (!window.confirm('Are you sure you want to delete this gig? This action cannot be undone.')) {
            return; // User cancelled
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('You are not logged in.');
            router.push('/login');
            return;
        }

        try {
            setLoading(true); // Show loading state during deletion
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/services/${gigId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (res.ok && data.success) {
                alert(data.message || 'Gig deleted successfully!');
                // Remove the deleted gig from the state
                setMyGigs(myGigs.filter(gig => gig._id !== gigId));
            } else {
                alert(`Error deleting gig: ${data.error || 'Unknown error.'}`);
            }
        } catch (err: unknown) { // Change 'any' to 'unknown' here
            console.error('Failed to delete gig:', err);
            if (err instanceof Error) { // Add this type narrowing check
                alert(`Failed to delete gig: ${err.message || 'Network error.'}`);
            } else {
                alert('Failed to delete gig: An unknown error occurred.'); // Fallback for non-Error types
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <>
                <Head><title>My Gigs | SkillShare</title></Head>
                <Navbar />
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p className={styles.loadingText}>Loading your gigs...</p>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Head><title>My Gigs | SkillShare</title></Head>
                <Navbar />
                <div className={styles.errorContainer}>
                    <span className={styles.errorIcon}>⚠️</span>
                    <p className={styles.errorText}>{error}</p>
                    <button onClick={() => window.location.reload()} className={styles.retryBtn}>
                        Try Again
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <Head><title>My Gigs | SkillShare</title></Head>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    <h1 className={styles.heading}>My Posted Gigs</h1>
                    
                    {/* Stats Header */}
                    <div className={styles.statsHeader}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                    <polyline points="14,2 14,8 20,8"/>
                                </svg>
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{myGigs.length}</span>
                                <span className={styles.statLabel}>Total Gigs</span>
                            </div>
                        </div>
                    </div>

                    {myGigs.length === 0 ? (
                        <div className={styles.noGigs}>
                            <span className={styles.emptyIcon}>📝</span>
                            <h2>No Gigs Yet</h2>
                            <p>You haven&apos;t posted any gigs yet. Share your skills with the community!</p>
                            <button onClick={() => router.push('/post-gig')} className={styles.postGigBtn}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                Post Your First Gig
                            </button>
                        </div>
                    ) : (
                        <div className={styles.gigList}>
                            {myGigs.map(gig => (
                                <div key={gig._id} className={styles.gigCard}>
                                    <h2 className={styles.gigTitle}>{gig.title}</h2>
                                    <p className={styles.gigDescription}>{gig.description}</p>
                                    <div className={styles.gigMeta}>
                                        <span className={styles.gigCategory}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                                                <line x1="7" y1="7" x2="7.01" y2="7"/>
                                            </svg>
                                            {gig.category}
                                        </span>
                                        <span className={styles.gigLocation}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                                <circle cx="12" cy="10" r="3"/>
                                            </svg>
                                            {gig.location.address || 'Location set'}
                                        </span>
                                        <span className={styles.gigPostedDate}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                                <line x1="16" y1="2" x2="16" y2="6"/>
                                                <line x1="8" y1="2" x2="8" y2="6"/>
                                                <line x1="3" y1="10" x2="21" y2="10"/>
                                            </svg>
                                            {new Date(gig.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className={styles.gigActions}>
                                        <button
                                            onClick={() => handleDeleteGig(gig._id)}
                                            className={styles.deleteBtn}
                                            disabled={loading}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3,6 5,6 21,6"/>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                            </svg>
                                            {loading ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}