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
                <div className={styles.card} aria-busy="true">
                    <div className={styles.skeletonLine} style={{ width: '60%', height: 32 }} />
                    <div className={styles.skeletonLine} style={{ width: '35%', height: 20 }} />
                    <div className={styles.skeletonLine} style={{ width: '100%', height: 16 }} />
                    <div className={styles.skeletonLine} style={{ width: '90%', height: 16 }} />
                    <ProfileSkeleton />
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
                <div className={styles.card}>
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

                    <div className={styles.priceRow}>
                        <span className={styles.priceLabel}>Price</span>
                        <span className={styles.price}>{formatPrice(service.price, service.currency)}</span>
                    </div>

                    <hr className={styles.divider} />

                    <div className={styles.providerSection}>
                        <span className={styles.avatar} aria-hidden="true">{getInitials(service.provider.name)}</span>
                        <div className={styles.providerInfo}>
                            <p className={styles.providerName}>
                                {service.provider.name}
                                {service.provider.verified && <span className={styles.verified} title="Verified">✔ Verified</span>}
                            </p>
                            {locationAddress && <p className={styles.providerMeta}>{locationAddress}</p>}
                        </div>
                    </div>

                    <div className={styles.actionArea}>
                        {!isAuthenticated ? (
                            <button className={styles.requestButton} onClick={() => router.push('/login')}>
                                Log in to Request
                            </button>
                        ) : isOwnService ? (
                            <p className={styles.ownServiceMessage}>This is your own service.</p>
                        ) : requestSent ? (
                            <div className={styles.requestSent}>
                                <p>✓ Request sent!</p>
                                <Link href="/my-jobs" className={styles.secondaryButton}>Track in My Jobs</Link>
                            </div>
                        ) : (
                            <button
                                className={styles.requestButton}
                                onClick={handleRequest}
                                disabled={requesting}
                            >
                                {requesting ? 'Sending…' : `Request ${service.provider.name.split(' ')[0]}'s Service`}
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}