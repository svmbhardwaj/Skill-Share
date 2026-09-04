import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

import { useAuth, ProtectedRoute } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ListSkeleton } from '../components/Skeleton';
import api, { ApiError } from '../lib/api';
import styles from '../styles/MyJobs.module.css';

type JobStatus = 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
type JobView = 'all' | 'buying' | 'selling';

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
    status: JobStatus;
    paymentStatus?: PaymentStatus;
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

const STATUS_CONFIG: Record<JobStatus, { class: string; icon: string; label: string }> = {
    requested:   { class: styles.requested, icon: '⏳', label: 'Requested' },
    accepted:    { class: styles.accepted, icon: '✅', label: 'Accepted' },
    in_progress: { class: styles.inProgress, icon: '🔨', label: 'In Progress' },
    completed:   { class: styles.completed, icon: '🎉', label: 'Completed' },
    cancelled:   { class: styles.cancelled, icon: '✕', label: 'Cancelled' },
};

// Minimal review form for a completed + paid job (client side)
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
            <p className={styles.reviewPrompt}>How was the service?</p>
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
    const [view, setView] = useState<JobView>('all');

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

    const roleOf = (job: Job): 'buying' | 'selling' | null => {
        if (currentUserId === String(job.client._id)) return 'buying';
        if (currentUserId === String(job.provider._id)) return 'selling';
        return null;
    };

    const visibleJobs = jobs.filter(job => {
        const role = roleOf(job);
        if (view === 'buying') return role === 'buying';
        if (view === 'selling') return role === 'selling';
        return role !== null;
    });

    const counts = {
        buying: jobs.filter(j => roleOf(j) === 'buying').length,
        selling: jobs.filter(j => roleOf(j) === 'selling').length,
    };

    const handleStatusUpdate = async (jobId: string, newStatus: JobStatus, successMessage: string) => {
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
            }>('/api/payments/create-order', { jobId });

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

            // Prefer the explicit public key from the frontend environment when set;
            // otherwise use the public key id returned by the backend at checkout.
            const checkoutKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || data.keyId;

            const options: RazorpayOptions = {
                key: checkoutKey,
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
                        }>('/api/payments/verify', {
                            orderId: response.razorpay_order_id,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature,
                        });

                        if (verify.success && verify.paymentStatus === 'paid') {
                            setJobs(prev => prev.map(job =>
                                job._id === jobId
                                    ? { ...job, paymentStatus: 'paid' as const }
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
                        api.post('/api/payments/status', { orderId: data.orderId, event: 'cancelled' }).catch(() => {});
                    },
                },
                events: {
                    'payment.failed': () => {
                        api.post('/api/payments/status', { orderId: data.orderId, event: 'failed' }).catch(() => {});
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch {
            showToast('Failed to initiate payment. Please try again.', 'error');
        } finally {
            setPayingJobId(null);
        }
    };

    const formatPrice = (price: number, currency?: string) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency || 'INR',
            maximumFractionDigits: 0,
        }).format(price);
    };

    const paymentBadge = (job: Job) => {
        if (job.paymentStatus === 'paid') {
            return <span className={`${styles.paymentChip} ${styles.paymentPaid}`}>✓ Payment received</span>;
        }
        if (job.paymentStatus === 'failed') {
            return <span className={`${styles.paymentChip} ${styles.paymentFailed}`}>Payment failed</span>;
        }
        return null;
    };

    if (loading) {
        return (
            <main className={styles.main}>
                <div className={styles.container}>
                    <h1 className={styles.heading}>My Jobs</h1>
                    <p className={styles.headingSubtitle}>Your requests and work in one place.</p>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <ListSkeleton count={1} />
                    </div>
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
                            Everything you&apos;re requesting and the work you&apos;re doing.
                        </p>
                    </header>

                    {/* Segmented control */}
                    {jobs.length > 0 && (
                        <div className={styles.viewTabs} role="tablist" aria-label="Filter jobs">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={view === 'all'}
                                className={`${styles.viewTab} ${view === 'all' ? styles.viewTabActive : ''}`}
                                onClick={() => setView('all')}
                            >
                                All <span className={styles.viewCount}>{jobs.length}</span>
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={view === 'buying'}
                                className={`${styles.viewTab} ${view === 'buying' ? styles.viewTabActive : ''}`}
                                onClick={() => setView('buying')}
                            >
                                Buying <span className={styles.viewCount}>{counts.buying}</span>
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={view === 'selling'}
                                className={`${styles.viewTab} ${view === 'selling' ? styles.viewTabActive : ''}`}
                                onClick={() => setView('selling')}
                            >
                                Selling <span className={styles.viewCount}>{counts.selling}</span>
                            </button>
                        </div>
                    )}

                    {visibleJobs.length === 0 ? (
                        <div className={styles.stateBlock}>
                            <span className={styles.stateIcon} aria-hidden="true">📝</span>
                            <h2>{view === 'selling' ? 'Nothing you’re selling yet' : view === 'buying' ? 'Nothing you’re buying yet' : 'No jobs yet'}</h2>
                            <p>
                                {view === 'selling'
                                    ? 'Requests from clients for your services will appear here.'
                                    : 'Browse services and request the help you need to get started.'}
                            </p>
                            <button
                                onClick={() => router.push(view === 'selling' ? '/my-services' : '/browse')}
                                className={styles.retryBtn}
                            >
                                {view === 'selling' ? 'View My Services' : 'Browse Services'}
                            </button>
                        </div>
                    ) : (
                        <div className={styles.jobsList}>
                            {visibleJobs.map(job => {
                                const role = roleOf(job);
                                const isProvider = role === 'selling';
                                const isClient = role === 'buying';
                                const statusConfig = STATUS_CONFIG[job.status];
                                const busy = actingJobId === job._id || payingJobId === job._id;
                                const isPaid = job.paymentStatus === 'paid';

                                return (
                                    <article key={job._id} className={`${styles.jobCard} ${isPaid ? styles.paidCard : ''}`}>
                                        <div className={styles.jobHeader}>
                                            <div>
                                                <h2 className={styles.jobTitle}>{job.service.title}</h2>
                                                <div className={styles.jobMetaInline}>
                                                    <span>
                                                        {isClient
                                                            ? `Provider: ${job.provider.name}`
                                                            : `Client: ${job.client.name}`}
                                                    </span>
                                                    <span className={styles.metaDivider}>·</span>
                                                    <span>Updated {new Date(job.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <span className={`${styles.statusBadge} ${statusConfig.class}`}>
                                                <span aria-hidden="true">{statusConfig.icon}</span>
                                                {statusConfig.label}
                                            </span>
                                        </div>

                                        <div className={styles.jobMeta}>
                                            <span className={styles.metaItem}>
                                                <span className={styles.price}>{formatPrice(job.price, job.currency)}</span>
                                            </span>
                                            {job.service.category && (
                                                <span className={styles.metaItem}>{job.service.category}</span>
                                            )}
                                            {paymentBadge(job)}
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

                                            {/* Client: pay once accepted (or later) */}
                                            {isClient &&
                                                !isPaid &&
                                                ['accepted', 'in_progress', 'completed'].includes(job.status) && (
                                                    <button
                                                        className={styles.payBtn}
                                                        onClick={() => handlePayNow(job._id)}
                                                        disabled={busy}
                                                    >
                                                        {payingJobId === job._id
                                                            ? 'Opening payment…'
                                                            : `Pay ${formatPrice(job.price, job.currency)}`}
                                                    </button>
                                                )}

                                            {/* Client or provider: cancel a pending job */}
                                            {isProvider
                                                ? ['accepted', 'in_progress'].includes(job.status) && (
                                                    <button
                                                        className={styles.cancelBtn}
                                                        onClick={() => handleStatusUpdate(job._id, 'cancelled', 'Job cancelled.')}
                                                        disabled={busy}
                                                    >
                                                        Cancel
                                                    </button>
                                                )
                                                : isClient && ['requested', 'accepted', 'in_progress'].includes(job.status) && (
                                                    <button
                                                        className={styles.cancelBtn}
                                                        onClick={() => handleStatusUpdate(job._id, 'cancelled', 'Job cancelled.')}
                                                        disabled={busy}
                                                    >
                                                        Cancel
                                                    </button>
                                                )}

                                            {/* Client: review once the job is completed and paid */}
                                            {isClient &&
                                                isPaid &&
                                                job.status === 'completed' &&
                                                !reviewedJobIds.has(job._id) && (
                                                    <JobReviewForm
                                                        jobId={job._id}
                                                        onDone={() => setReviewedJobIds(prev => new Set(prev).add(job._id))}
                                                    />
                                                )}
                                            {isClient &&
                                                job.status === 'completed' &&
                                                reviewedJobIds.has(job._id) && (
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
