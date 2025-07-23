// frontend/src/pages/MyGigs.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import * as jsonwebtoken from 'jsonwebtoken'; // Using jsonwebtoken as discussed

// Styling (you'll need to create this or adapt to Tailwind)
import styles from '../styles/MyGigs.module.css'; // You'll need to create this CSS module or use Tailwind classes

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

// TypeScript types
interface DecodedToken {
    id: string;      // The user ID, which you definitely expect
    exp?: number;    // Standard JWT expiration time (optional, as it's not always critical for frontend use)
    iat?: number;    // Standard JWT issued at time (optional)
    name?: string;   // If your JWT payload includes the user's name
    email?: string;  // If your JWT payload includes the user's email
    // Add any other specific properties you know your JWT payload might contain,
    // making them optional with '?' if they might not always be present.
    // Example: role?: string; if you have user roles in your JWT
}
export default function MyGigs() {
    const router = useRouter();
    const [myGigs, setMyGigs] = useState<Gig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const decodedPayload: string | object | null = jsonwebtoken.decode(token);
            if (typeof decodedPayload === 'object' && decodedPayload !== null && 'id' in decodedPayload) {
                setCurrentUserId((decodedPayload as DecodedToken).id);
            } else {
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
                // Fetch all gigs from the backend
                // In a real app, you might have a specific endpoint like /api/gigs/my or filter by postedBy
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/gigs`, {
                    headers: {
                        'Authorization': `Bearer ${token}`, // Still needs auth for potential user info or filtering
                    },
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Failed to fetch gigs.');
                }

                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    // Filter gigs on the frontend to show only those posted by the current user
                    // This assumes backend populates 'postedBy' field as an object with _id
                    const usersGigs = data.data.filter((gig: Gig) => gig.postedBy && gig.postedBy._id === currentUserId);
                    setMyGigs(usersGigs);
                } else {
                    setError(data.error || 'Failed to fetch gigs.');
                }
            } catch (err: unknown) { // Change 'any' to 'unknown'
                if (err instanceof Error) {
                    setError(err.message); // Now TypeScript knows err is an Error
                } else {
                    // Fallback for errors that are not instances of Error (e.g., plain strings, numbers)
                    setError('An unknown error occurred while fetching your gigs.');
                }
            } finally {
                setLoading(false);
            }
        };

        // Ensure currentUserId is set before fetching gigs
        if (currentUserId) {
            fetchMyGigs();
        }

    }, [router, currentUserId]); // Depend on router and currentUserId


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
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/gigs/${gigId}`, {
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
        return <p>Loading your gigs...</p>;
    }

    if (error) {
        return <p style={{ color: 'red' }}>Error: {error}</p>;
    }

    return (
        <>
            <Head><title>My Gigs | SkillShare Local</title></Head>
            <main className={styles.main}>
                <div className={styles.container}>
                    <h1 className={styles.heading}>My Posted Gigs</h1>
                    {myGigs.length === 0 ? (
                        <div className={styles.noGigs}>
                            <p>You haven&apos;t posted any gigs yet.</p>
                            <button onClick={() => router.push('/post-gig')} className={styles.postGigBtn}>Post a New Gig</button>
                        </div>
                    ) : (
                        <div className={styles.gigList}>
                            {myGigs.map(gig => (
                                <div key={gig._id} className={styles.gigCard}>
                                    <h2 className={styles.gigTitle}>{gig.title}</h2>
                                    <p className={styles.gigDescription}>{gig.description}</p>
                                    <p className={styles.gigCategory}>Category: {gig.category}</p>
                                    <p className={styles.gigLocation}>Location: {gig.location.address || 'Not specified'}</p>
                                    <p className={styles.gigPostedDate}>Posted: {new Date(gig.createdAt).toLocaleDateString()}</p>
                                    <button
                                        onClick={() => handleDeleteGig(gig._id)}
                                        className={styles.deleteBtn}
                                        disabled={loading} // Disable button during deletion
                                    >
                                        {loading ? 'Deleting...' : 'Delete Gig'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}