import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { useAuth, ProtectedRoute } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api, { ApiError } from '../lib/api';
import styles from '../styles/Profile.module.css';

interface Stats {
    servicesPosted: number;
    jobs: number;
}

function ProfileContent() {
    const router = useRouter();
    const { user, updateUser } = useAuth();
    const { showToast } = useToast();
    const [stats, setStats] = useState<Stats>({ servicesPosted: 0, jobs: 0 });
    const [editMode, setEditMode] = useState(false);
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
        }
    }, [user]);

    // Load real counts from existing APIs
    useEffect(() => {
        let cancelled = false;

        const loadStats = async () => {
            try {
                const [servicesRes, jobsRes] = await Promise.all([
                    api.get<{ success: boolean; data: unknown[] }>('/api/services/my'),
                    api.get<{ success: boolean; pagination?: { total: number } }>('/api/jobs/myjobs?limit=1'),
                ]);
                if (cancelled) return;
                setStats({
                    servicesPosted: servicesRes.success ? servicesRes.data.length : 0,
                    jobs: jobsRes.pagination?.total ?? 0,
                });
            } catch {
                // Non-fatal — profile still renders
            }
        };

        loadStats();
        return () => { cancelled = true; };
    }, []);

    const handleUpdateName = async () => {
        if (!name.trim()) return;

        setSaving(true);
        try {
            const data = await api.put<{
                success: boolean;
                user: { id: string; name: string; email: string; avatar?: string };
            }>('/api/auth/update-profile', { name });

            if (data.success) {
                updateUser({ name });
                setEditMode(false);
                showToast('Name updated.', 'success');
            }
        } catch (err) {
            showToast(err instanceof ApiError ? err.message : 'Could not update your name.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <>
            <Head>
                <title>Profile | SkillShare</title>
            </Head>

            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Profile Header */}
                    <div className={styles.profileHeader}>
                        <div className={styles.avatarSection}>
                            {user?.avatar ? (
                                <Image src={user.avatar} alt={user.name} className={styles.avatar} width={112} height={112} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {user ? getInitials(user.name) : 'U'}
                                </div>
                            )}
                        </div>

                        <div className={styles.userInfo}>
                            {editMode ? (
                                <div className={styles.editName}>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className={styles.nameInput}
                                        placeholder="Enter your name"
                                        maxLength={100}
                                        aria-label="Your name"
                                    />
                                    <div className={styles.editActions}>
                                        <button onClick={handleUpdateName} className={styles.saveBtn} disabled={saving}>
                                            {saving ? 'Saving…' : 'Save'}
                                        </button>
                                        <button onClick={() => setEditMode(false)} className={styles.cancelBtn} disabled={saving}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <h1 className={styles.userName}>
                                    {user?.name}
                                    <button onClick={() => setEditMode(true)} className={styles.editBtn} title="Edit name" aria-label="Edit name">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>
                                    </button>
                                </h1>
                            )}
                            <p className={styles.userEmail}>{user?.email}</p>
                            <div className={styles.badges}>
                                {user?.authProvider === 'google' && (
                                    <span className={styles.badge}>
                                        Google Account
                                    </span>
                                )}
                                <span className={styles.memberSince}>
                                    Member since {formatDate(user?.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Real activity, loaded from the API */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                    <polyline points="14,2 14,8 20,8"/>
                                </svg>
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{stats.servicesPosted}</span>
                                <span className={styles.statLabel}>Services Posted</span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                                </svg>
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{stats.jobs}</span>
                                <span className={styles.statLabel}>Jobs</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className={styles.quickActions}>
                        <h2>Quick Actions</h2>
                        <div className={styles.actionsGrid}>
                            <button onClick={() => router.push('/post-service')} className={styles.actionCard}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                Offer a Service
                            </button>
                            <button onClick={() => router.push('/browse')} className={styles.actionCard}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <circle cx="11" cy="11" r="8"/>
                                    <path d="m21 21-4.35-4.35"/>
                                </svg>
                                Browse Services
                            </button>
                            <button onClick={() => router.push('/my-jobs')} className={styles.actionCard}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                                </svg>
                                View My Jobs
                            </button>
                            <button onClick={() => router.push('/my-services')} className={styles.actionCard}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                    <polyline points="14,2 14,8 20,8"/>
                                </svg>
                                Manage My Services
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

export default function Profile() {
    return (
        <ProtectedRoute>
            <ProfileContent />
        </ProtectedRoute>
    );
}