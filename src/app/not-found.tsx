'use client';

import { useRouter } from 'next/navigation';

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <h1 className="text-9xl font-bold text-blue-600 mb-4">404</h1>
                <h2 className="text-3xl font-semibold text-gray-900 mb-4">Page Not Found</h2>
                <p className="text-gray-600 mb-8">
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>
                <div className="space-y-4">
                    <button
                        onClick={() => router.push('/')}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                        Return to Home
                    </button>
                    <button
                        onClick={() => router.back()}
                        className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
} 