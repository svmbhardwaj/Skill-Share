import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ProtectedRoute } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ListSkeleton } from '../components/Skeleton';
import ConfirmDialog from '../components/ConfirmDialog';
import api, { ApiError } from '../lib/api';
import styles from '../styles/MyServices.module.css';

interface Service {
    _id: string;
    title: string;
    description: string;
    category: string;
    location?: {
        type?: string;
        coordinates?: [number, number];
        address?: string;
    };
    createdAt: string;
}

function MyServicesContent() {
    const router = useRouter();
    const { showToast } = useToast();
    const [myServices, setMyServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [removeTarget, setRemoveTarget] = useState<Service | null>(null);
    const [removing, setRemoving] = useState(false);

    const fetchMyServices = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await api.get<{
                success: boolean;
                data: Service[];
                error?: string;
            }>('/api/services/my');

            if (data.success && Array.isArray(data.data)) {
                setMyServices(data.data);
            } else {
                setError(data.error || 'Failed to fetch services.');
            }
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('An unknown error occurred while fetching your services.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyServices();
    }, []);

    const handleRemove = async () => {
        if (!removeTarget) return;

        setRemoving(true);
        try {
            const data = await api.delete<{
                success: boolean;
                message?: string;
                error?: string;
            }>(`/api/services/${removeTarget._id}`);

            if (data.success) {
                setMyServices(prev => prev.filter(s => s._id !== removeTarget._id));
                showToast('Service removed.', 'success');
                setRemoveTarget(null);
            } else {
                showToast(data.error || 'Could not remove the service.', 'error');
                setRemoveTarget(null);
            }
        } catch (err) {
            showToast(err instanceof ApiError ? err.message : 'Failed to remove the service.', 'error');
            setRemoveTarget(null);
        } finally {
            setRemoving(false);
        }
    };

    if (loading) {
        return (
            <main className={styles.main}>
                <div className={styles.container}>
                    <h1 className={styles.heading}>My Services</h1>
                    <p className={styles.headingSubtitle}>Services you&apos;re offering to your community.</p>
                    <div className={styles.serviceList} aria-busy="true">
                        <ListSkeleton count={3} />
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.stateBlock}>
                        <span className={styles.stateIcon} aria-hidden="true">⚠️</span>
                        <h2>Couldn&apos;t load your services</h2>
                        <p>{error}</p>
                        <button onClick={fetchMyServices} className={styles.retryBtn}>Try Again</button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <>
            <Head><title>My Services | SkillShare</title></Head>
            <main className={styles.main}>
                <div className={styles.container}>
                    <header className={styles.pageHeader}>
                        <h1 className={styles.heading}>My Services</h1>
                        <p className={styles.headingSubtitle}>
                            Services you&apos;re offering to your community.
                        </p>
                    </header>

                    {myServices.length === 0 ? (
                        <div className={styles.stateBlock}>
                            <span className={styles.stateIcon} aria-hidden="true">📝</span>
                            <h2>No services yet</h2>
                            <p>Share a skill and start helping your neighbors.</p>
                            <button onClick={() => router.push('/post-service')} className={styles.retryBtn}>
                                Offer a Service
                            </button>
                        </div>
                    ) : (
                        <div className={styles.serviceList}>
                            {myServices.map(service => (
                                <article key={service._id} className={styles.serviceCard}>
                                    <div className={styles.serviceHeader}>
                                        <h2 className={styles.serviceTitle}>{service.title}</h2>
                                        <span className={styles.categoryTag}>{service.category}</span>
                                    </div>
                                    <p className={styles.serviceDescription}>{service.description}</p>
                                    <div className={styles.serviceFooter}>
                                        <span className={styles.serviceMeta}>
                                            {service.location?.address || 'No address set'}
                                        </span>
                                        <span className={styles.serviceMeta}>
                                            Posted {new Date(service.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className={styles.cardActions}>
                                        <Link href={`/post-service?edit=${service._id}`} className={styles.editBtn}>
                                            Edit
                                        </Link>
                                        <button
                                            className={styles.removeBtn}
                                            onClick={() => setRemoveTarget(service)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <ConfirmDialog
                open={removeTarget !== null}
                title="Remove this service?"
                message={
                    removeTarget
                        ? `"${removeTarget.title}" will no longer appear in search results. Jobs that already reference it stay valid.`
                        : ''
                }
                confirmLabel="Remove"
                cancelLabel="Keep it"
                danger
                busy={removing}
                onConfirm={handleRemove}
                onCancel={() => !removing && setRemoveTarget(null)}
            />
        </>
    );
}

export default function MyServices() {
    return (
        <ProtectedRoute>
            <MyServicesContent />
        </ProtectedRoute>
    );
}