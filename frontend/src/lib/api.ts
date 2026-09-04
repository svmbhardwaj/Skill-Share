/**
 * Centralized API client for SkillShare frontend.
 * 
 * - Wraps fetch with base URL from NEXT_PUBLIC_BACKEND_API_URL
 * - Automatically attaches Authorization: Bearer <token> when available
 * - On 401 response, attempts token refresh before failing
 * - Centralizes error handling
 */

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000';

export class ApiError extends Error {
    status: number;
    data: Record<string, unknown>;

    constructor(message: string, status: number, data: Record<string, unknown> = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
}

function getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
}

function setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
}

function clearAuth(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
}

// Track if we're currently refreshing to prevent concurrent refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
        const response = await fetch(`${BASE_URL}/api/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
            clearAuth();
            return null;
        }

        const data = await response.json();
        if (data.success && data.token) {
            setToken(data.token);
            return data.token;
        }

        clearAuth();
        return null;
    } catch {
        clearAuth();
        return null;
    }
}

interface RequestOptions {
    /** Skip automatic Authorization header (for public endpoints) */
    skipAuth?: boolean;
    /** Custom headers to merge */
    headers?: Record<string, string>;
    /** AbortSignal for cancellation */
    signal?: AbortSignal;
}

async function request<T = Record<string, unknown>>(
    endpoint: string,
    fetchOptions: RequestInit = {},
    options: RequestOptions = {}
): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
        ...((options.headers as Record<string, string>) || {}),
    };

    // Auto-attach content-type for non-FormData bodies
    if (fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    // Auto-attach auth token
    if (!options.skipAuth) {
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    let response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: options.signal,
    });

    // Handle 401 — try token refresh before giving up
    if (response.status === 401 && !options.skipAuth) {
        // Attempt token refresh (deduplicated)
        if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = refreshAccessToken();
        }

        const newToken = await refreshPromise;
        isRefreshing = false;
        refreshPromise = null;

        if (newToken) {
            // Retry the original request with new token
            headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(url, {
                ...fetchOptions,
                headers,
                signal: options.signal,
            });
        }

        // If still 401 after refresh, clear auth and redirect
        if (response.status === 401) {
            clearAuth();
            if (typeof window !== 'undefined') {
                if (!window.location.pathname.includes('/login')) {
                    // Full-page redirect: this module has no router access (not a component)
                    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                    window.location.href = '/login';
                }
            }
            throw new ApiError('Session expired. Please log in again.', 401);
        }
    }

    // Parse response
    let data: T;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    } else {
        data = (await response.text()) as unknown as T;
    }

    // Handle error responses
    if (!response.ok) {
        const errorData = data as Record<string, unknown>;
        const message = (errorData?.error as string) || (errorData?.message as string) || `Request failed with status ${response.status}`;
        throw new ApiError(message, response.status, errorData);
    }

    return data;
}

// ============================================================
// Convenience methods
// ============================================================

export const api = {
    get<T = Record<string, unknown>>(endpoint: string, options?: RequestOptions) {
        return request<T>(endpoint, { method: 'GET' }, options);
    },

    post<T = Record<string, unknown>>(endpoint: string, body?: unknown, options?: RequestOptions) {
        return request<T>(
            endpoint,
            {
                method: 'POST',
                body: body ? JSON.stringify(body) : undefined,
            },
            options
        );
    },

    put<T = Record<string, unknown>>(endpoint: string, body?: unknown, options?: RequestOptions) {
        return request<T>(
            endpoint,
            {
                method: 'PUT',
                body: body ? JSON.stringify(body) : undefined,
            },
            options
        );
    },

    patch<T = Record<string, unknown>>(endpoint: string, body?: unknown, options?: RequestOptions) {
        return request<T>(
            endpoint,
            {
                method: 'PATCH',
                body: body ? JSON.stringify(body) : undefined,
            },
            options
        );
    },

    delete<T = Record<string, unknown>>(endpoint: string, options?: RequestOptions) {
        return request<T>(endpoint, { method: 'DELETE' }, options);
    },
};

export default api;
