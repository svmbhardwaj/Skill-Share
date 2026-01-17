import React from 'react';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
    className?: string;
    count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = '20px',
    borderRadius = '8px',
    className = '',
    count = 1,
}) => {
    const style: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
    };

    return (
        <>
            <style jsx global>{`
                @keyframes skeleton-shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} style={style} className={className} />
            ))}
        </>
    );
};

// Card Skeleton for gig/service cards
export const CardSkeleton: React.FC = () => (
    <div style={{
        background: 'rgba(30, 30, 30, 0.6)',
        borderRadius: '16px',
        padding: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.08)',
    }}>
        <Skeleton height={180} borderRadius="12px" />
        <div style={{ marginTop: '1rem' }}>
            <Skeleton height={24} width="70%" />
        </div>
        <div style={{ marginTop: '0.75rem' }}>
            <Skeleton height={16} count={2} />
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <Skeleton height={32} width={80} borderRadius="20px" />
            <Skeleton height={32} width={100} borderRadius="20px" />
        </div>
    </div>
);

// Profile skeleton
export const ProfileSkeleton: React.FC = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Skeleton width={48} height={48} borderRadius="50%" />
        <div style={{ flex: 1 }}>
            <Skeleton height={18} width="60%" />
            <div style={{ marginTop: '0.5rem' }}>
                <Skeleton height={14} width="40%" />
            </div>
        </div>
    </div>
);

// List item skeleton
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {Array.from({ length: count }).map((_, index) => (
            <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: 'rgba(30, 30, 30, 0.6)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
                <Skeleton width={60} height={60} borderRadius="12px" />
                <div style={{ flex: 1 }}>
                    <Skeleton height={18} width="50%" />
                    <div style={{ marginTop: '0.5rem' }}>
                        <Skeleton height={14} width="80%" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export default Skeleton;
