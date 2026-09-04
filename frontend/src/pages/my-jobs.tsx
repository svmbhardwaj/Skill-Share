import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

import { useAuth, ProtectedRoute } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ListSkeleton } from '../components/Skeleton';
import api, { ApiError } from '../lib/api';
import styles from '../styles/MyJobs.module.css';

interface Service {
    _id: string;
    title: string;
    category?: string;
    imageUrl?: string;
}

interface UserReference {
    _id: string;
    name: string;
    avatar?: string;
}

interface Job {
    _id: string;
    status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'paid' | 'cancelled';
    paymentStatus?: string;
    price: number;
    currency?: string;
    service: Service;
    client: UserReference;
    provider: UserReference;
    updatedAt: string;
}

// Razorpay Checkout is loaded from their CDN at runtime.
declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => { open: () => void };
    }
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    order_id: string;
    prefill?: { name?: string; email?: string };
    modal?: { ondismiss?: () => void };
    handler?: (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
    }) => void;
    events?: {
        'payment.failed'?: (response: { error: { code?: string; description?: string } }) => void;
    };
}

// Lazily inject the Razorpay checkout script (only the public key is used client-side)
function loadRazorpayScript(): Promise<boolean> {
    return new Promise(resolve => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

// Minimal review form for a completed/paid job (client side)
function JobReviewForm({ jobId, onDone }: { jobId: string; onDone: () => void }) {
    const { showToast } = useToast();
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating < 1) {
            showToast('Please select a star rating.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const data = await api.post<{
                success: boolean;
                data?: unknown;
                error?: string;
            }>('/api/reviews', { jobId, rating, comment: comment || undefined });

            if (data.success) {
                showToast('Thanks for your review!', 'success');
                setOpen(false);
                onDone();
            } else {
                showToast(data.error || 'Could not submit the review.', 'error');
            }
        } catch (err) {
            showToast(err instanceof ApiError ? err.message : 'Could not submit the review.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) {
        return (
            <button className={styles.reviewLink} onClick={() => setOpen(true)}>
                Leave a review
            </button>
        );
    }

    return (
        <div className={styles.reviewForm}>
            <div className={styles.stars} role="group" aria-label="Rating">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        type="button"
                        className={`${styles.star} ${star <= rating ? styles.starActive : ''}`}
                        onClick={() => setRating(star)}
                        aria-label={`${star} star${star === 1 ? '' : 's'}`}
                        aria-pressed={star <= rating}
                    >
                        ★
                    </button>
                ))}
            </div>
            <textarea
                className={styles.reviewInput}
                placeholder="What was your experience like? (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={3}
                aria-label="Review comment"
            />
            <div className={styles.reviewActions}>
                <button className={styles.reviewCancel} onClick={() => setOpen(false)} disabled={submitting}>
                    Cancel
                </button>
                <button className={styles.reviewSubmit} onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit Review'}
                </button>
            </div>
        </div>
    );
}

function MyJobsContent() {
    const router = useRouter();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actingJobId, setActingJobId] = useState<string | null>(null);
    const [payingJobId, setPayingJobId] = useState<string | null>(null);
    const [reviewedJobIds, setReviewedJobIds] = useState<Set<string>>(new Set());

    const currentUserId = user?.id || '';

    const fetchJobs = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await api.get<{
                success: boolean;
                data: Job[];
                pagination?: { total: number; pages: number };
                error?: string;
            }>('/api/jobs/myjobs');

            if (data.success) {
                setJobs(data.data);
            } else {
                setError(data.error || 'Failed to fetch jobs.');
            }
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('An error occurred while fetching your jobs.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleStatusUpdate = async (jobId: string, newStatus: Job['status'], successMessage: string) => {
        setActingJobId(jobId);
        try {
            const data = await api.patch<{
                success: boolean;
                data: Job;
                error?: string;
            }>(`/api/jobs/${jobId}/status`, { status: newStatus });

            if (data.success) {
                setJobs(prev => prev.map(job => (job._id === jobId ? { ...job, status: newStatus } : job)));
                showToast(successMessage, 'success');
            } else {
                showToast(data.error || 'Could not update the job.', 'error');
            }
        } catch (err) {
            showToast(err instanceof ApiError ? err.message : 'Failed to update the job.', 'error');
        } finally {
            setActingJobId(null);
        }
    };

    const handlePayNow = async (jobId: string) => {
        setPayingJobId(jobId);
        try {
            const data = await api.post<{
                success: boolean;
                orderId?: string;
                amount?: number;
                currency?: string;
                keyId?: string;
                error?: string;
            }>('/api/payment/create-order', { jobId });

            if (!data.success || !data.orderId || !data.keyId || typeof data.amount !== 'number') {
                showToast('Could not initiate payment. ' + (data.error || ''), 'error');
                setPayingJobId(null);
                return;
            }

            const loaded = await loadRazorpayScript();
            if (!loaded) {
                showToast('Could not load the payment gateway. Please try again.', 'error');
                setPayingJobId(null);
                return;
            }

            const options: RazorpayOptions = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency || 'INR',
                name: 'SkillShare',
                description: 'Service payment',
                order_id: data.orderId,
                prefill: {
                    name: user?.name,
                    email: user?.email,
                },
                handler: async response => {
                    try {
                        const verify = await api.post<{
                            success: boolean;
                            paymentStatus?: string;
                            jobStatus?: string;
                            error?: string;
                        }>('/api/payment/verify', {
                            orderId: response.razorpay_order_id,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature,
                        });

                        if (verify.success && verify.paymentStatus === 'succeeded') {
                            setJobs(prev => prev.map(job =>
                                job._id === jobId
                                    ? { ...job, status: 'paid' as const, paymentStatus: 'succeeded' }
                                    : job
                            ));
                            showToast('Payment successful!', 'success');
                        } else {
                            showToast('Payment could not be confirmed: ' + (verify.error || 'Unknown error'), 'error');
                        }
                    } catch (err) {
                        showToast(err instanceof ApiError ? err.message : 'Payment verification failed.', 'error');
                    }
                },
                modal: {
                    ondismiss: () => {
                        api.post('/api/payment/status', { orderId: data.orderId, event: 'cancelled' }).catch(() => {});
                    },
                },
                events: {
                    'payment.failed': () => {
                        api.post('/api/payment/status', { orderId: data.orderId, event: 'failed' }).catch(() => {});
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error('Payment error:', err);
            showToast('Failed to initiate payment. Please try again.', 'error');
        } finally {
            setPayingJobId(null);
        }
    };

    const getStatusConfig = (status: Job['status']) => {
        const configs: Record<string, { class: string; icon: string; label: string }> = {
            requested:   { class: styles.requested, icon: '⏳', label: 'Requested' },
            accepted:    { class: styles.accepted, icon: '✅', label: 'Accepted' },
            in_progress: { class: styles.inProgress, icon: '🔨', label: 'In Progress' },
            completed:   { class: styles.completed, icon: '🎉', label: 'Completed' },
            paid:        { class: styles.paid, icon: '💰', label: 'Paid' },
            cancelled:   { class: styles.cancelled, icon: '❌', label: 'Cancelled' },
        };
        return configs[status] || { class: '', icon: '❓', label: status };
    };

    const formatPrice = (price: number, currency?: string) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency || 'INR',
            maximumFractionDigits: 0,
        }).format(price);
    };

    if (loading) {
        return (
            <main className={styles.main}>
                <div className={styles.container}>
                    <h1 className={styles.heading}>My Jobs</h1>
                    <p className={styles.headingSubtitle}>Your requests and work in one place.</p>
                    <div className={styles.jobsList} aria-busy="true">
                        <ListSkeleton count={3} />
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className={styles.main}>
                <div className={styles.stateBlock}>
                    <span className={styles.stateIcon} aria-hidden="true">⚠️</span>
                    <h2>Couldn&apos;t load your jobs</h2>
                    <p>{error}</p>
                    <button onClick={fetchJobs} className={styles.retryBtn}>Try Again</button>
                </div>
            </main>
        );
    }

    return (
        <>
            <Head><title>My Jobs | SkillShare</title></Head>
            <main className={styles.main}>
                <div className={styles.container}>
                    <header className={styles.pageHeader}>
                        <h1 className={styles.heading}>My Jobs</h1>
                        <p className={styles.headingSubtitle}>
                            Requests you&apos;ve made and work you&apos;re doing.
                        </p>
                    </header>

                    {jobs.length === 0 ? (
                        <div className={styles.stateBlock}>
                            <span className={styles.stateIcon} aria-hidden="true">📝</span>
                            <h2>No jobs yet</h2>
                            <p>Browse services and request the help you need to get started.</p>
                            <button onClick={() => router.push('/browse')} className={styles.retryBtn}>
                                Browse Services
                            </button>
                        </div>
                    ) : (
                        <div className={styles.jobsList}>
                            {jobs.map(job => {
                                const statusConfig = getStatusConfig(job.status);
                                const isProvider = currentUserId === String(job.provider._id);
                                const isClient = currentUserId === String(job.client._id);
                                const busy = actingJobId === job._id || payingJobId === job._id;

                                return (
                                    <article key={job._id} className={`${styles.jobCard} ${job.status === 'paid' ? styles.paidCard : ''}`}>
                                        <div className={styles.jobHeader}>
                                            <h2 className={styles.jobTitle}>{job.service.title}</h2>
                                            <span className={`${styles.statusBadge} ${statusConfig.class}`}>
                                                <span aria-hidden="true">{statusConfig.icon}</span>
                                                {statusConfig.label}
                                            </span>
                                        </div>

                                        <div className={styles.jobMeta}>
                                            <span className={styles.metaItem}>
                                                {isClient ? `Provider: ${job.provider.name}` : `Client: ${job.client.name}`}
                                            </span>
                                            <span className={styles.metaItem}>
                                                <span className={styles.price}>{formatPrice(job.price, job.currency)}</span>
                                            </span>
                                            {job.service.category && (
                                                <span className={styles.metaItem}>{job.service.category}</span>
                                            )}
                                        </div>

                                        <div className={styles.jobActions}>
                                            {/* Provider: accept or decline a requested job */}
                                            {job.status === 'requested' && isProvider && (
                                                <>
                                                    <button
                                                        className={styles.acceptBtn}
                                                        onClick={() => handleStatusUpdate(job._id, 'accepted', 'Job accepted!')}
                                                        disabled={busy}
                                                    >
                                                        {actingJobId === job._id ? 'Saving…' : 'Accept'}
                                                    </button>
                                                    <button
                                                        className={styles.declineBtn}
                                                        onClick={() => handleStatusUpdate(job._id, 'cancelled', 'Request declined.')}
                                                        disabled={busy}
                                                    >
                                                        Decline
                                                    </button>
                                                </>
                                            )}

                                            {/* Provider: start work */}
                                            {job.status === 'accepted' && isProvider && (
                                                <button
                                                    className={styles.startBtn}
                                                    onClick={() => handleStatusUpdate(job._id, 'in_progress', 'Work started!')}
                                                    disabled={busy}
                                                >
                                                    Start Work
                                                </button>
                                            )}

                                            {/* Provider: mark complete */}
                                            {job.status === 'in_progress' && isProvider && (
                                                <button
                                                    className={styles.completeBtn}
                                                    onClick={() => handleStatusUpdate(job._id, 'completed', 'Marked as completed!')}
                                                    disabled={busy}
                                                >
                                                    Mark Complete
                                                </button>
                                            )}

                                            {/* Client: pay for an accepted or completed job */}
                                            {(job.status === 'accepted' || job.status === 'completed') && isClient && (
                                                <button
                                                    className={styles.payBtn}
                                                    onClick={() => handlePayNow(job._id)}
                                                    disabled={busy}
                                                >
                                                    {payingJobId === job._id ? 'Opening payment…' : `Pay ${formatPrice(job.price, job.currency)}`}
                                                </button>
                                            )}

                                            {/* Either party: cancel a pending job (providers use Decline on requested jobs) */}
                                            {['requested', 'accepted'].includes(job.status) && (isClient || isProvider) && !(job.status === 'requested' && isProvider) && (
                                                <button
                                                    className={styles.cancelBtn}
                                                    onClick={() => handleStatusUpdate(job._id, 'cancelled', 'Job cancelled.')}
                                                    disabled={busy}
                                                >
                                                    Cancel
                                                </button>
                                            )}

                                            {/* Terminal states */}
                                            {(job.status === 'paid' || job.status === 'completed') && isClient && !reviewedJobIds.has(job._id) && (
                                                <JobReviewForm
                                                    jobId={job._id}
                                                    onDone={() => setReviewedJobIds(prev => new Set(prev).add(job._id))}
                                                />
                                            )}
                                            {(job.status === 'paid' || job.status === 'completed') && isClient && reviewedJobIds.has(job._id) && (
                                                <span className={styles.doneNote}>✓ Thanks for using SkillShare</span>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}

export default function MyJobs() {
    return (
        <ProtectedRoute>
            <MyJobsContent />
        </ProtectedRoute>
    );
}