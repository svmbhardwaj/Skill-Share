import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ProtectedRoute } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api, { ApiError } from '../lib/api';
import styles from '../styles/PostService.module.css';

const CATEGORIES = ['Education', 'Repair', 'Health & Fitness', 'Tech Help', 'Other'];

function PostServiceContent() {
    const router = useRouter();
    const { showToast } = useToast();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (!category) {
            setError('Please select a category.');
            return;
        }
        if (!price || Number(price) <= 0) {
            setError('Please enter a valid price.');
            return;
        }

        setSubmitting(true);
        try {
            const data = await api.post<{
                success: boolean;
                data: unknown;
                error?: string;
            }>('/api/services', {
                title,
                description,
                category,
                price: Number(price),
                contactInfo,
            });

            if (data.success) {
                showToast('Service published!', 'success');
                router.push('/my-services');
            } else {
                setError(data.error || 'Failed to post service.');
            }
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Could not connect to the server.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Head>
                <title>Offer a Service | SkillShare</title>
                <meta name="description" content="Share your skills with your local community" />
            </Head>

            <main className={styles.main}>
                <div className={styles.header}>
                    <h1 className={styles.heading}>Offer a Service</h1>
                    <p className={styles.subtitle}>
                        Tell your neighbors what you can help with. Your service appears in local search results.
                    </p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="service-title">Title</label>
                        <input
                            id="service-title"
                            type="text"
                            placeholder="e.g. Piano lessons for beginners"
                            className={styles.input}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="service-description">Description</label>
                        <textarea
                            id="service-description"
                            placeholder="What do you offer, and what should clients know?"
                            className={styles.input}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={1000}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="service-category">Category</label>
                        <select
                            id="service-category"
                            className={styles.input}
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                        >
                            <option value="" disabled>Select a category</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="service-price">Price (₹)</label>
                            <div className={styles.priceInput}>
                                <span className={styles.pricePrefix} aria-hidden="true">₹</span>
                                <input
                                    id="service-price"
                                    type="number"
                                    min="1"
                                    placeholder="500"
                                    className={styles.input}
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="service-contact">Contact Info</label>
                            <input
                                id="service-contact"
                                type="text"
                                placeholder="Phone or email"
                                className={styles.input}
                                value={contactInfo}
                                onChange={(e) => setContactInfo(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <p className={styles.formError} role="alert">{error}</p>
                    )}

                    <p className={styles.hint}>
                        Your saved location is used to show your service to people nearby. You can skip
                        adding a location when you register.
                    </p>

                    <button type="submit" className={styles.button} disabled={submitting}>
                        {submitting ? 'Publishing…' : 'Publish Service'}
                    </button>
                </form>
            </main>
        </>
    );
}

export default function PostService() {
    return (
        <ProtectedRoute>
            <PostServiceContent />
        </ProtectedRoute>
    );
}