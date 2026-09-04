import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ProtectedRoute, useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api, { ApiError } from '../lib/api';
import styles from '../styles/PostService.module.css';

const CATEGORIES = ['Education', 'Repair', 'Health & Fitness', 'Tech Help', 'Other'];

interface ServiceToEdit {
    _id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    contactInfo: string;
    provider: { _id: string; name: string };
}

function PostServiceContent() {
    const router = useRouter();
    const { user } = useAuth();
    const { showToast } = useToast();

    const editId = typeof router.query.edit === 'string' ? router.query.edit : null;
    const isEditing = editId !== null;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loadingEdit, setLoadingEdit] = useState(isEditing);

    // Load the service being edited and confirm ownership
    useEffect(() => {
        if (!editId) return;

        const loadService = async () => {
            setLoadingEdit(true);
            try {
                const data = await api.get<{
                    success: boolean;
                    data?: ServiceToEdit;
                    error?: string;
                }>(`/api/services/${editId}`);

                if (!data.success || !data.data) {
                    setError(data.error || 'Could not load this service.');
                    return;
                }

                if (user && String(data.data.provider._id) !== String(user.id)) {
                    setError('You can only edit your own services.');
                    return;
                }

                setTitle(data.data.title);
                setDescription(data.data.description);
                setCategory(data.data.category);
                setPrice(String(data.data.price));
                setContactInfo(data.data.contactInfo);
            } catch (err) {
                if (err instanceof ApiError) {
                    setError(err.message);
                } else {
                    setError('Could not load this service.');
                }
            } finally {
                setLoadingEdit(false);
            }
        };

        loadService();
    }, [editId, user]);

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
            const body = {
                title,
                description,
                category,
                price: Number(price),
                contactInfo,
            };

            if (isEditing) {
                const data = await api.put<{
                    success: boolean;
                    data: unknown;
                    error?: string;
                }>(`/api/services/${editId}`, body);

                if (data.success) {
                    showToast('Service updated!', 'success');
                    router.push('/my-services');
                } else {
                    setError(data.error || 'Failed to update service.');
                }
            } else {
                const data = await api.post<{
                    success: boolean;
                    data: unknown;
                    error?: string;
                }>('/api/services', body);

                if (data.success) {
                    showToast('Service published!', 'success');
                    router.push('/my-services');
                } else {
                    setError(data.error || 'Failed to post service.');
                }
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

    if (loadingEdit) {
        return (
            <main className={styles.main}>
                <div className={styles.header}>
                    <h1 className={styles.heading}>Edit Service</h1>
                </div>
                <div className={styles.form} aria-busy="true">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={styles.skeletonLine} style={{ height: 44 }} />
                    ))}
                </div>
            </main>
        );
    }

    return (
        <>
            <Head>
                <title>{isEditing ? 'Edit Service | SkillShare' : 'Offer a Service | SkillShare'}</title>
                <meta name="description" content="Share your skills with your local community" />
            </Head>

            <main className={styles.main}>
                <div className={styles.header}>
                    <h1 className={styles.heading}>
                        {isEditing ? 'Edit Service' : 'Offer a Service'}
                    </h1>
                    <p className={styles.subtitle}>
                        {isEditing
                            ? 'Update the details below — existing requests for this service stay valid.'
                            : 'Tell your neighbors what you can help with. Your service appears in local search results.'}
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
                        <span className={styles.charCount}>{title.length}/100</span>
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
                        <span className={styles.charCount}>{description.length}/1000</span>
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

                    <div className={styles.formActions}>
                        <button type="submit" className={styles.button} disabled={submitting}>
                            {submitting
                                ? isEditing ? 'Saving…' : 'Publishing…'
                                : isEditing ? 'Save Changes' : 'Publish Service'}
                        </button>
                        {isEditing && (
                            <button
                                type="button"
                                className={styles.cancelEditBtn}
                                onClick={() => router.push('/my-services')}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
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
