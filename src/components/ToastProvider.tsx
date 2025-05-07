'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
    return (
        <Toaster
            position="bottom-right"
            toastOptions={{
                success: {
                    style: {
                        background: '#10B981',
                        color: 'white',
                    },
                    duration: 3000,
                },
                error: {
                    style: {
                        background: '#EF4444',
                        color: 'white',
                    },
                    duration: 3000,
                },
            }}
        />
    );
} 