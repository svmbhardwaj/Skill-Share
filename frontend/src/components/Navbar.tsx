import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import styles from '../styles/Navbar.module.css';

interface User {
    name: string;
    email: string;
    avatar?: string;
}

export default function Navbar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token) {
            setIsLoggedIn(true);
            if (userData) {
                try {
                    setUser(JSON.parse(userData));
                } catch {
                    console.error('Error parsing user data');
                }
            }
            // Fetch fresh user data from API
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        const freshUser = {
                            name: data.name,
                            email: data.email,
                            avatar: data.avatar
                        };
                        setUser(freshUser);
                        localStorage.setItem('user', JSON.stringify(freshUser));
                    }
                })
                .catch(err => console.error('Error fetching user:', err));
        }

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setUser(null);
        router.push('/');
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>⚡</span>
                    <span className={styles.white}>Skill</span>
                    <span className={styles.blue}>Share</span>
                </Link>

                <div className={styles.navLinks}>
                    <Link href="/browse" className={`${styles.navLink} ${router.pathname === '/browse' ? styles.active : ''}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35"/>
                        </svg>
                        Browse
                    </Link>
                    
                    {isLoggedIn ? (
                        <>
                            <Link href="/my-jobs" className={`${styles.navLink} ${router.pathname === '/my-jobs' ? styles.active : ''}`}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                                </svg>
                                My Jobs
                            </Link>
                            <Link href="/MyGigs" className={`${styles.navLink} ${router.pathname === '/MyGigs' ? styles.active : ''}`}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                    <polyline points="14,2 14,8 20,8"/>
                                </svg>
                                My Gigs
                            </Link>
                            <Link href="/post-gig" className={styles.postGigBtn}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                Post Gig
                            </Link>
                            
                            <div className={styles.profileMenu}>
                                <button className={styles.profileBtn}>
                                    {user?.avatar ? (
                                        <Image src={user.avatar} alt={user.name} className={styles.avatar} width={40} height={40} />
                                    ) : (
                                        <div className={styles.avatarPlaceholder}>
                                            {user ? getInitials(user.name) : 'U'}
                                        </div>
                                    )}
                                </button>
                                <div className={styles.dropdown}>
                                    <div className={styles.dropdownHeader}>
                                        <p className={styles.userName}>{user?.name || 'User'}</p>
                                        <p className={styles.userEmail}>{user?.email}</p>
                                    </div>
                                    <div className={styles.dropdownDivider} />
                                    <Link href="/profile" className={styles.dropdownItem}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                            <circle cx="12" cy="7" r="4"/>
                                        </svg>
                                        Profile
                                    </Link>
                                    <button onClick={handleLogout} className={styles.dropdownItem}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                            <polyline points="16,17 21,12 16,7"/>
                                            <line x1="21" y1="12" x2="9" y2="12"/>
                                        </svg>
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className={styles.navLink}>Login</Link>
                            <Link href="/register" className={styles.registerBtn}>
                                Get Started
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                    <polyline points="12,5 19,12 12,19"/>
                                </svg>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button 
                    className={styles.mobileMenuBtn} 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <span className={`${styles.hamburger} ${isMobileMenuOpen ? styles.open : ''}`} />
                </button>
            </div>

            {/* Mobile Menu */}
            <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.open : ''}`}>
                <Link href="/browse" onClick={() => setIsMobileMenuOpen(false)}>Browse Gigs</Link>
                {isLoggedIn ? (
                    <>
                        <Link href="/my-jobs" onClick={() => setIsMobileMenuOpen(false)}>My Jobs</Link>
                        <Link href="/MyGigs" onClick={() => setIsMobileMenuOpen(false)}>My Gigs</Link>
                        <Link href="/post-gig" onClick={() => setIsMobileMenuOpen(false)}>Post a Gig</Link>
                        <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>Profile</Link>
                        <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                        <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}
