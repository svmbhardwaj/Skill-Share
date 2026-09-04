import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { ProfileSkeleton } from '../../components/Skeleton';
import api, { ApiError } from '../../lib/api';
import styles from '../../styles/ServiceDetail.module.css';

interface Service {
    _id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    currency?: string;
    contactInfo: string;
    provider: {
        _id: string;
        name: string;
        email: string;
        verified: boolean;
    };
    location?: {
        type?: string;
        coordinates?: [number, number];
        address?: string;
    };
    averageRating?: number;
    totalReviews?: number;
}

const formatPrice = (price: number, currency?: string) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency || 'INR',
        maximumFractionDigits: 0,
    }).format(price);
};

const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export default function ServiceDetail() {
    const router = useRouter();
    const { id } = router.query;
    const { user, isAuthenticated } = useAuth();
    const { showToast } = useToast();

    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [requesting, setRequesting] = useState(false);
    const [requestSent, setRequestSent] = useState(false);

    const currentUserId = user?.id || '';

    useEffect(() => {
        if (id) {
            const fetchServiceDetails = async () => {
                try {
                    const data = await api.get<{
                        success: boolean;
                        data: Service;
                        error?: string;
                    }>(`/api/services/${id}`, { skipAuth: true });

                    if (data.success) {
                        setService(data.data);
                    } else {
                        setError(data.error || 'Failed to fetch service details.');
                    }
                } catch (err) {
                    if (err instanceof ApiError) {
                        setError(err.message);
                    } else {
                        setError('An error occurred while fetching this service.');
                    }
                } finally {
                    setLoading(false);
                }
            };
            fetchServiceDetails();
        }
    }, [id]);

    const handleRequest = async () => {
        if (!isAuthenticated) {
            showToast('Please log in to request a service.', 'info');
            router.push('/login');
            return;
        }

        setRequesting(true);
        try {
            const data = await api.post<{
                success: boolean;
                data: unknown;
                error?: string;
            }>('/api/jobs/hire', { serviceId: id });

            if (data.success) {
                setRequestSent(true);
                showToast('Request sent! The provider will be notified.', 'success');
            } else {
                showToast(data.error || 'Could not send the request.', 'error');
            }
        } catch (err) {
            showToast(err instanceof ApiError ? err.message : 'Failed to send request.', 'error');
        } finally {
            setRequesting(false);
        }
    };

    if (loading) {
        return (
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.layout}>
                        <div className={styles.infoCard} aria-busy="true">
                            <div className={styles.skeletonLine} style={{ width: '35%', height: 28 }} />
                            <div className={styles.skeletonLine} style={{ width: '60%', height: 36 }} />
                            <div className={styles.skeletonLine} style={{ width: '100%', height: 16 }} />
                            <div className={styles.skeletonLine} style={{ width: '90%', height: 16 }} />
                            <div style={{ marginTop: '1.5rem' }}>
                                <ProfileSkeleton />
                            </div>
                        </div>
                        <div className={styles.actionCard} aria-busy="true">
                            <div className={styles.skeletonLine} style={{ width: '70%', height: 24 }} />
                            <div className={styles.skeletonLine} style={{ width: '100%', height: 44 }} />
                        </div>
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
                    <h2>Couldn&apos;t load this service</h2>
                    <p>{error}</p>
                    <button className={styles.retryBtn} onClick={() => router.reload()}>
                        Try Again
                    </button>
                </div>
            </main>
        );
    }

    if (!service) {
        return (
            <main className={styles.main}>
                <div className={styles.stateBlock}>
                    <span className={styles.stateIcon} aria-hidden="true">🔍</span>
                    <h2>Service not found</h2>
                    <Link href="/browse" className={styles.retryBtn}>Browse Services</Link>
                </div>
            </main>
        );
    }

    const hasRating = (service.totalReviews ?? 0) > 0;
    const isOwnService = currentUserId === String(service.provider._id);
    const locationAddress = service.location?.address;

    return (
        <>
            <Head>
                <title>{service.title} | SkillShare</title>
            </Head>
            <main className={styles.main}>
                <div className={styles.container}>
                    <Link href="/browse" className={styles.backLink}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
                        </svg>
                        Browse services
                    </Link>

                    <div className={styles.layout}>
                        {/* Main information */}
                        <article className={styles.infoCard}>
                            <div className={styles.cardTop}>
                                <span className={styles.categoryTag}>{service.category}</span>
                                {hasRating && (
                                    <span className={styles.rating}>
                                        ★ {service.averageRating?.toFixed(1)} · {service.totalReviews} review{service.totalReviews === 1 ? '' : 's'}
                                    </span>
                                )}
                            </div>

                            <h1 className={styles.title}>{service.title}</h1>
                            <p className={styles.description}>{service.description}</p>

                            <div className={styles.providerSection}>
                                <div className={styles.provider}>
                                    <span className={styles.avatar} aria-hidden="true">{getInitials(service.provider.name)}</span>
                                    <div className={styles.providerInfo}>
                                        <p className={styles.providerName}>
                                            Offered by {service.provider.name}
                                            {service.provider.verified && (
                                                <span className={styles.verified} title="Verified">✔ Verified</span>
                                            )}
                                        </p>
                                        {locationAddress && (
                                            <p className={styles.providerMeta}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
                                                </svg>
                                                {locationAddress}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </article>

                        {/* Price + action */}
                        <aside className={styles.actionCard} aria-label="Service price and request">
                            <p className={styles.priceLabel}>Price</p>
                            <p className={styles.price}>{formatPrice(service.price, service.currency)}</p>

                            <div className={styles.actionArea}>
                                {!isAuthenticated ? (
                                    <>
                                        <button className={styles.requestButton} onClick={() => router.push('/login')}>
                                            Log in to Request
                                        </button>
                                        <p className={styles.actionHint}>
                                            Have an account?{' '}
                                            <Link href="/login">Log in</Link> or{' '}
                                            <Link href="/register">register</Link> to request this service.
                                        </p>
                                    </>
                                ) : isOwnService ? (
                                    <div className={styles.ownServiceBox}>
                                        <p className={styles.ownServiceTitle}>This is your service</p>
                                        <p className={styles.ownServiceMessage}>
                                            Track incoming requests in{' '}
                                            <Link href="/my-jobs">My Jobs</Link>.
                                        </p>
                                        <Link
                                            href={`/post-service?edit=${service._id}`}
                                            className={styles.editServiceBtn}
                                        >
                                            Edit Service
                                        </Link>
                                    </div>
                                ) : requestSent ? (
                                    <div className={styles.requestSent}>
                                        <p className={styles.requestSentTitle}>✓ Request sent!</p>
                                        <p className={styles.actionHint}>
                                            The provider has been notified. Track the request in My Jobs.
                                        </p>
                                        <Link href="/my-jobs" className={styles.secondaryButton}>
                                            Track in My Jobs
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            className={styles.requestButton}
                                            onClick={handleRequest}
                                            disabled={requesting}
                                        >
                                            {requesting ? 'Sending…' : `Request ${service.provider.name.split(' ')[0]}'s Service`}
                                        </button>
                                        <p className={styles.actionHint}>
                                            No charge yet — you&apos;ll pay securely once the provider accepts your request.
                                        </p>
                                    </>
                                )}
                            </div>

                            <div className={styles.actionSteps}>
                                <p className={styles.actionStepsTitle}>What happens next</p>
                                <ol className={styles.actionStepsList}>
                                    <li>The provider gets your request</li>
                                    <li>Pay once your request is accepted</li>
                                    <li>The provider completes the work</li>
                                    <li>Leave a review when it&apos;s done</li>
                                </ol>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </>
    );
}
