import React from 'react';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
    className?: string;
    count?: number;
}

const shimmerColors =
    'linear-gradient(90deg, #ece5d9 25%, #f6f1e8 50%, #ece5d9 75%)';

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
        background: shimmerColors,
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.4s ease-in-out infinite',
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

// Card Skeleton for service cards
export const CardSkeleton: React.FC = () => (
    <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        padding: '1.5rem',
        border: '1px solid #eae3d7',
        boxShadow: '0 6px 18px rgba(74, 62, 38, 0.06)',
    }}>
        <Skeleton height={20} width="40%" borderRadius="10px" />
        <div style={{ marginTop: '1rem' }}>
            <Skeleton height={24} width="70%" />
        </div>
        <div style={{ marginTop: '0.75rem' }}>
            <Skeleton height={16} count={2} />
        </div>
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton height={20} width={90} borderRadius="10px" />
            <Skeleton height={36} width={110} borderRadius="12px" />
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
                padding: '1.25rem',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #eae3d7',
                boxShadow: '0 6px 18px rgba(74, 62, 38, 0.06)',
            }}>
                <Skeleton width={60} height={60} borderRadius="14px" />
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
