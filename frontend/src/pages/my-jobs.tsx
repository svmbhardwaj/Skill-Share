// frontend/src/pages/my-jobs.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import * as jsonwebtoken from 'jsonwebtoken';
import styles from '../styles/MyJobs.module.css';

// TypeScript types
interface DecodedToken {
    id: string;
    exp?: number;
    iat?: number;
    name?: string;
    email?: string;
}

interface Service {
    _id: string;
    title: string;
}

interface UserReference {
    _id: string;
    name: string;
}

interface Job {
    _id: string;
    status: 'requested' | 'accepted' | 'paid' | 'cancelled';
    price: number;
    service: Service;
    client: UserReference;
    provider: UserReference;
}

export default function MyJobs() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [clientSecret, setClientSecret] = useState<string>('');

    // ✅ fallback to localhost if NEXT_PUBLIC_BACKEND_API_URL isn’t set
    const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5000";

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
                throw new Error('Invalid token payload structure.');
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error('Error decoding token:', err);
                router.push('/login');
            } else {
                console.error('Error decoding token:', err);
                router.push('/login');
            }
            return;
        }

        const fetchJobs = async () => {
            setLoading(true);
            try {
                console.log("🔍 Fetching jobs from:", `${API_URL}/api/jobs/myjobs`);

                const res = await fetch(`${API_URL}/api/jobs/myjobs`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) {
                    let errorMessage = `Failed to fetch jobs (status ${res.status})`;
                    try {
                        const errorData = await res.json();
                        errorMessage = errorData.error || errorMessage;
                    } catch {
                        // response wasn’t JSON (likely HTML error page)
                        const text = await res.text();
                        console.error("Server returned non-JSON response:", text.slice(0, 200));
                    }
                    throw new Error(errorMessage);
                }

                const data = await res.json();
                if (data.success) {
                    setJobs(data.data);
                } else {
                    setError(data.error || 'Failed to fetch jobs.');
                }
            } catch (err: unknown) {
                if (err instanceof Error) {
                    console.error("❌ Error fetching jobs:", err);
                    setError(err.message);
                } else {
                    console.error("❌ Error fetching jobs:", err);
                    setError('An unknown error occurred while fetching jobs.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, [router, API_URL]);

    const handleStatusUpdate = async (jobId: string, newStatus: Job['status']) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('You are not logged in.');
            router.push('/login');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/jobs/${jobId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                setJobs(jobs.map(job => (job._id === jobId ? { ...job, status: newStatus } : job)));
                alert(`Job status updated to ${newStatus}.`);
            } else {
                alert(`Error updating job status: ${data.error || 'Unknown error.'}`);
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error('❌ Failed to update job status:', err);
                alert(`Failed to update job status: ${err.message}`);
            } else {
                console.error('❌ Failed to update job status:', err);
                alert('Failed to update job status: Network error.');
            }
        }
    };

    const handlePayNow = async (jobId: string) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('You are not logged in.');
            router.push('/login');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/payment/create-payment-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ jobId }),
            });
            const data = await res.json();
            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
            } else {
                alert('Error: Could not initiate payment. ' + (data.error || ''));
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error('❌ Failed to connect to the payment server:', err);
                alert(`Failed to connect to the payment server: ${err.message}`);
            } else {
                console.error('❌ Failed to connect to the payment server:', err);
                alert('Failed to connect to the payment server: Network error.');
            }
        }
    };

    const getStatusClass = (status: Job['status']) => {
        switch (status) {
            case 'requested': return styles.requested;
            case 'accepted': return styles.accepted;
            case 'paid': return styles.paid;
            case 'cancelled': return styles.cancelled;
            default: return '';
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <p>Loading your jobs...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <p style={{ color: 'red' }}>Error: {error}</p>
                <button onClick={() => window.location.reload()} className={styles.retryBtn}>Retry</button>
            </div>
        );
    }

    return (
        <>
            <Head><title>My Jobs | SkillShare Local</title></Head>
            <main className={styles.main}>
                <div className={styles.container}>
                    <h1 className={styles.heading}>My Jobs Dashboard</h1>
                    {jobs.length === 0 ? (
                        <div className={styles.noJobs}>
                            <p>You have no active jobs or job requests at the moment.</p>
                            <button onClick={() => router.push('/browse-gigs')} className={styles.browseGigsBtn}>Browse Gigs</button>
                        </div>
                    ) : (
                        jobs.map(job => (
                            <div key={job._id} className={styles.jobCard}>
                                <h2 className={styles.title}>{job.service.title}</h2>
                                <div className={styles.details}>
                                    <p><strong>Status:</strong> <span className={`${styles.status} ${getStatusClass(job.status)}`}>{job.status}</span></p>
                                    <p><strong>Price:</strong> ${job.price}</p>
                                    <p><strong>Client:</strong> {job.client.name}</p>
                                    <p><strong>Provider:</strong> {job.provider.name}</p>
                                </div>
                                <div className={styles.actions}>
                                    {job.status === 'requested' && currentUserId === job.provider._id && (
                                        <>
                                            <button onClick={() => handleStatusUpdate(job._id, 'accepted')} className={styles.acceptBtn}>Accept</button>
                                            <button onClick={() => handleStatusUpdate(job._id, 'cancelled')} className={styles.declineBtn}>Decline</button>
                                        </>
                                    )}
                                    {job.status === 'accepted' && currentUserId === job.client._id && (
                                        <button onClick={() => handlePayNow(job._id)} className={styles.payBtn}>Pay Now</button>
                                    )}
                                    {(job.status === 'requested' || job.status === 'accepted') && (currentUserId === job.client._id || currentUserId === job.provider._id) && (
                                        <button onClick={() => handleStatusUpdate(job._id, 'cancelled')} className={styles.cancelActionBtn}>Cancel Job</button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </>
    );
}
