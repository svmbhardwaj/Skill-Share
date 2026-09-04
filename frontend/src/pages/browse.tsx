import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import api, { ApiError } from '../lib/api';
import { CardSkeleton } from '../components/Skeleton';
import styles from '../styles/Browse.module.css';

interface Service {
    _id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    currency?: string;
    imageUrl: string;
    provider: {
        name: string;
        verified: boolean;
    };
    location?: {
        type?: string;
        coordinates?: [number, number]; // [longitude, latitude]
        address?: string;
    };
    averageRating?: number;
    totalReviews?: number;
}

const CATEGORIES = ['Education', 'Repair', 'Health & Fitness', 'Tech Help', 'Other'];

const formatPrice = (price: number, currency?: string) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency || 'INR',
        maximumFractionDigits: 0,
    }).format(price);
};

const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

// Haversine distance in km between two [lat, lon] points
const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function BrowseServices() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

    const fetchServices = async (lat: number, lon: number) => {
        setLoading(true);
        setError('');
        try {
            const radius = 20;
            const data = await api.get<{
                success: boolean;
                data: Service[];
                error?: string;
            }>(`/api/services?lat=${lat}&lon=${lon}&radius=${radius}`, { skipAuth: true });

            if (data.success) {
                setServices(data.data);
            } else {
                setError(data.error || 'Failed to fetch services.');
            }
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('An error occurred while fetching services.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Default to Delhi when geolocation is unavailable or denied
        const defaultLocation = { lat: 28.6139, lon: 77.209 };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = { lat: position.coords.latitude, lon: position.coords.longitude };
                    setUserLocation(loc);
                    fetchServices(loc.lat, loc.lon);
                },
                () => {
                    setUserLocation(defaultLocation);
                    fetchServices(defaultLocation.lat, defaultLocation.lon);
                }
            );
        } else {
            setUserLocation(defaultLocation);
            fetchServices(defaultLocation.lat, defaultLocation.lon);
        }
    }, []);

    const filteredServices = useMemo(() => {
        const term = search.trim().toLowerCase();
        return services.filter(service => {
            const matchesCategory = category === 'All' || service.category === category;
            const matchesSearch =
                !term ||
                service.title.toLowerCase().includes(term) ||
                service.description.toLowerCase().includes(term);
            return matchesCategory && matchesSearch;
        });
    }, [services, search, category]);

    const renderError = () => (
        <div className={styles.stateBlock}>
            <span className={styles.stateIcon} aria-hidden="true">⚠️</span>
            <h2>Couldn&apos;t load services</h2>
            <p>{error}</p>
            <button className={styles.retryBtn} onClick={() => userLocation && fetchServices(userLocation.lat, userLocation.lon)}>
                Try Again
            </button>
        </div>
    );

    const renderEmpty = () => {
        const hasServices = services.length > 0;
        return (
            <div className={styles.stateBlock}>
                <span className={styles.stateIcon} aria-hidden="true">{hasServices ? '🔍' : '📭'}</span>
                <h2>{hasServices ? 'No matching services' : 'No services nearby yet'}</h2>
                <p>
                    {hasServices
                        ? 'Try a different search term or category.'
                        : 'Be the first to offer a service in your area.'}
                </p>
                {!hasServices && (
                    <Link href="/post-service" className={styles.retryBtn}>
                        Offer a Service
                    </Link>
                )}
            </div>
        );
    };

    return (
        <>
            <Head>
                <title>Browse Services | SkillShare</title>
                <meta name="description" content="Find trusted local services offered by your community" />
            </Head>

            <main className={styles.main}>
                <div className={styles.container}>
                    <header className={styles.header}>
                        <h1 className={styles.heading}>Find local services</h1>
                        <p className={styles.subtitle}>
                            Real people offering real help in your community.
                        </p>

                        {/* Search */}
                        <div className={styles.searchBar} role="search">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                            <input
                                type="search"
                                placeholder="Search services, e.g. tutoring, repairs…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                aria-label="Search services"
                            />
                            {search && (
                                <button className={styles.clearSearch} onClick={() => setSearch('')} aria-label="Clear search">
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Category filter */}
                        <div className={styles.filters} role="group" aria-label="Filter by category">
                            <button
                                className={`${styles.filterChip} ${category === 'All' ? styles.filterChipActive : ''}`}
                                onClick={() => setCategory('All')}
                            >
                                All
                            </button>
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    className={`${styles.filterChip} ${category === cat ? styles.filterChipActive : ''}`}
                                    onClick={() => setCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </header>

                    {loading ? (
                        <div className={styles.grid} aria-busy="true" aria-label="Loading services">
                            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
                        </div>
                    ) : error ? (
                        renderError()
                    ) : filteredServices.length === 0 ? (
                        renderEmpty()
                    ) : (
                        <div className={styles.grid}>
                            {filteredServices.map(service => {
                                const distance =
                                    userLocation &&
                                    service.location?.coordinates?.length === 2
                                        ? distanceKm(
                                            userLocation.lat,
                                            userLocation.lon,
                                            service.location.coordinates[1],
                                            service.location.coordinates[0]
                                        )
                                        : null;
                                const hasRating = (service.totalReviews ?? 0) > 0;

                                return (
                                    <article key={service._id} className={styles.card}>
                                        <div className={styles.cardTop}>
                                            <span className={styles.categoryTag}>{service.category}</span>
                                            {hasRating && (
                                                <span className={styles.rating}>
                                                    ★ {service.averageRating?.toFixed(1)} · {service.totalReviews}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className={styles.title}>{service.title}</h3>
                                        <p className={styles.desc}>{service.description}</p>

                                        <div className={styles.provider}>
                                            <span className={styles.avatar} aria-hidden="true">
                                                {getInitials(service.provider.name)}
                                            </span>
                                            <span className={styles.providerName}>
                                                {service.provider.name}
                                                {service.provider.verified && (
                                                    <span className={styles.verified} title="Verified">✔</span>
                                                )}
                                            </span>
                                        </div>

                                        <div className={styles.cardFooter}>
                                            <span className={styles.price}>
                                                {formatPrice(service.price, service.currency)}
                                            </span>
                                            {distance !== null && (
                                                <span className={styles.distance}>
                                                    ~{distance < 1 ? '<1' : Math.round(distance)} km away
                                                </span>
                                            )}
                                        </div>

                                        <Link href={`/services/${service._id}`} className={styles.button}>
                                            View Details
                                        </Link>
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