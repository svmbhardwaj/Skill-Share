import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import styles from '../styles/Profile.module.css';

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    authProvider?: string;
    createdAt?: string;
}

interface Stats {
    gigsPosted: number;
    jobsCompleted: number;
    totalEarnings: number;
}

export default function Profile() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [_stats, _setStats] = useState<Stats>({ gigsPosted: 0, jobsCompleted: 0, totalEarnings: 0 });
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [name, setName] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const fetchProfile = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const data = await res.json();
                
                if (data.success) {
                    // API returns user data spread directly, not nested in data.user
                    const userData = {
                        id: data._id || data.id,
                        name: data.name,
                        email: data.email,
                        avatar: data.avatar,
                        authProvider: data.authProvider,
                        createdAt: data.createdAt,
                    };
                    setUser(userData);
                    setName(userData.name || '');
                    // Update localStorage with fresh data
                    localStorage.setItem('user', JSON.stringify(userData));
                } else {
                    router.push('/login');
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const handleUpdateName = async () => {
        const token = localStorage.getItem('token');
        if (!token || !name.trim()) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/update-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name }),
            });
            const data = await res.json();
            
            if (data.success) {
                setUser(prev => prev ? { ...prev, name } : null);
                localStorage.setItem('user', JSON.stringify({ ...user, name }));
                setEditMode(false);
            }
        } catch (err) {
            console.error('Error updating profile:', err);
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

    if (loading) {
        return (
            <>
                <Navbar />
                <div className={styles.loadingContainer}>
                    <div className="spinner" />
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Profile | SkillShare</title>
            </Head>
            <Navbar />
            
            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Profile Header */}
                    <div className={styles.profileHeader}>
                        <div className={styles.avatarSection}>
                            {user?.avatar ? (
                                <Image src={user.avatar} alt={user.name} className={styles.avatar} width={120} height={120} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {user ? getInitials(user.name) : 'U'}
                                </div>
                            )}
                            <div className={styles.onlineIndicator} />
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
                                    />
                                    <div className={styles.editActions}>
                                        <button onClick={handleUpdateName} className={styles.saveBtn}>Save</button>
                                        <button onClick={() => setEditMode(false)} className={styles.cancelBtn}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <h1 className={styles.userName}>
                                    {user?.name}
                                    <button onClick={() => setEditMode(true)} className={styles.editBtn} title="Edit Name" aria-label="Edit Name">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                                        <svg width="14" height="14" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        Google Account
                                    </span>
                                )}
                                <span className={styles.memberSince}>
                                    Member since {formatDate(user?.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                    <polyline points="14,2 14,8 20,8"/>
                                </svg>
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{stats.gigsPosted}</span>
                                <span className={styles.statLabel}>Gigs Posted</span>
                            </div>
                        </div>
                        
                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                    <polyline points="22,4 12,14.01 9,11.01"/>
                                </svg>
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{stats.jobsCompleted}</span>
                                <span className={styles.statLabel}>Jobs Completed</span>
                            </div>
                        </div>
                        
                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.statIconOrange}`}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="1" x2="12" y2="23"/>
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                </svg>
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>${stats.totalEarnings}</span>
                                <span className={styles.statLabel}>Total Earnings</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className={styles.quickActions}>
                        <h2>Quick Actions</h2>
                        <div className={styles.actionsGrid}>
                            <button onClick={() => router.push('/post-gig')} className={styles.actionCard}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                Post a New Gig
                            </button>
                            <button onClick={() => router.push('/browse')} className={styles.actionCard}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8"/>
                                    <path d="m21 21-4.35-4.35"/>
                                </svg>
                                Browse Services
                            </button>
                            <button onClick={() => router.push('/my-jobs')} className={styles.actionCard}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                                </svg>
                                View My Jobs
                            </button>
                            <button onClick={() => router.push('/MyGigs')} className={styles.actionCard}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                    <polyline points="14,2 14,8 20,8"/>
                                </svg>
                                Manage My Gigs
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
