import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';

// ============================================================
// Types
// ============================================================

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    authProvider?: string;
    createdAt?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    loading: boolean;
    login: (token: string, user: AuthUser, refreshToken?: string) => void;
    logout: () => void;
    updateUser: (user: Partial<AuthUser>) => void;
    isAuthenticated: boolean;
}

// ============================================================
// Context
// ============================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================
// Provider
// ============================================================

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const clearAuthState = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }, []);

    // Load auth state from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken) {
            setToken(storedToken);

            // Try parsing stored user data for fast initial render
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch {
                    // Corrupted user data, ignore
                }
            }

            // Verify token is still valid by fetching fresh user data
            api.get<{
                success: boolean;
                _id?: string;
                id?: string;
                name?: string;
                email?: string;
                avatar?: string;
                authProvider?: string;
                createdAt?: string;
            }>('/api/auth/me')
                .then(data => {
                    if (data.success) {
                        const freshUser: AuthUser = {
                            id: (data._id || data.id) as string,
                            name: data.name as string,
                            email: data.email as string,
                            avatar: data.avatar,
                            authProvider: data.authProvider,
                            createdAt: data.createdAt,
                        };
                        setUser(freshUser);
                        localStorage.setItem('user', JSON.stringify(freshUser));
                    } else {
                        // Token invalid
                        clearAuthState();
                    }
                })
                .catch(() => {
                    // 401 is handled by api client (clears storage + redirects)
                    // Other errors: keep stale data but don't crash
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const login = useCallback((newToken: string, newUser: AuthUser, refreshToken?: string) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }
    }, []);

    const logout = useCallback(() => {
        clearAuthState();
        router.push('/');
    }, [clearAuthState, router]);

    const updateUser = useCallback((updates: Partial<AuthUser>) => {
        setUser(prev => {
            if (!prev) return prev;
            const updated = { ...prev, ...updates };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const value: AuthContextType = {
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!token && !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// ============================================================
// Hook
// ============================================================

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// ============================================================
// ProtectedRoute wrapper
// ============================================================

interface ProtectedRouteProps {
    children: ReactNode;
    /** Optional fallback to show while checking auth */
    fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [loading, isAuthenticated, router]);

    if (loading) {
        return (
            fallback || (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '60vh',
                    color: '#94a3b8',
                    fontSize: '1.1rem',
                }}>
                    Loading...
                </div>
            )
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect via useEffect
    }

    return <>{children}</>;
}

export default AuthContext;
