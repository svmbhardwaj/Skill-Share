import { useEffect, useRef } from 'react';
import styles from '../styles/ConfirmDialog.module.css';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false,
    busy = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const confirmRef = useRef<HTMLButtonElement>(null);

    // Close on Escape; focus the confirm button when opened
    useEffect(() => {
        if (!open) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !busy) {
                onCancel();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        confirmRef.current?.focus();

        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, busy, onCancel]);

    if (!open) return null;

    return (
        <div
            className={styles.overlay}
            onClick={() => !busy && onCancel()}
            role="presentation"
        >
            <div
                className={styles.dialog}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                aria-describedby="confirm-message"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="confirm-title" className={styles.title}>{title}</h2>
                <p id="confirm-message" className={styles.message}>{message}</p>
                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={onCancel}
                        disabled={busy}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        ref={confirmRef}
                        type="button"
                        className={`${styles.confirmBtn} ${danger ? styles.confirmDanger : ''}`}
                        onClick={onConfirm}
                        disabled={busy}
                    >
                        {busy ? 'Working…' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}