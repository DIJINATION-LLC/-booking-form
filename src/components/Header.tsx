'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface UserData {
    profileImage?: string;
    firstName: string;
    lastName: string;
}

const Header: React.FC = () => {
    const router = useRouter();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);

    React.useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            // For testing, set a default user
            const defaultUser = {
                firstName: "John",
                lastName: "Doe"
            };
            localStorage.setItem('user', JSON.stringify(defaultUser));
            setUserData(defaultUser);
        } else {
            setUserData(JSON.parse(user));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <header className="bg-white shadow-sm fixed w-full z-50">
            <div className="max-w-7xl mx-auto px-4 h-24">
                <div className="flex justify-between items-center h-full">
                    {/* Logo */}
                    <div
                        className="flex items-center cursor-pointer"
                        onClick={() => router.push('/portal')}
                    >
                        <div className="w-20 h-20 relative mr-4">
                            <Image
                                src="/logo.png"
                                alt="Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <span className="text-2xl font-semibold text-blue-600">Hire a Clinic</span>
                    </div>

                    {/* Profile Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center space-x-3 hover:bg-gray-50 rounded-full p-2 transition-colors duration-200"
                        >
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium text-lg">
                                    {userData?.firstName?.[0]}{userData?.lastName?.[0]}
                                </span>
                            </div>
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showProfileMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-100">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <div className="text-sm font-medium text-gray-900">
                                        {userData?.firstName} {userData?.lastName}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        router.push('/profile');
                                        setShowProfileMenu(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Profile
                                </button>
                                <button
                                    onClick={() => {
                                        router.push('/profile/bookings');
                                        setShowProfileMenu(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    My Bookings
                                </button>
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setShowProfileMenu(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header; 