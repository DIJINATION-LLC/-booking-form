'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LoginFormData {
    email: string;
    password: string;
}

const LoginForm = () => {
    const router = useRouter();
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: '',
    });
    const [isNewUser, setIsNewUser] = useState(false);
    const [registrationFee, setRegistrationFee] = useState(250);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically send the data to your backend
        console.log('Login submitted:', formData);
        if (isNewUser) {
            // Handle registration fee payment
            console.log('Registration fee:', registrationFee);
        }
        // Redirect to booking page after successful login
        router.push('/booking');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">
                {isNewUser ? 'Register' : 'Login'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                {isNewUser && (
                    <div className="bg-yellow-50 p-4 rounded-md">
                        <p className="text-yellow-800">
                            Registration Fee: ${registrationFee} (one-time payment)
                        </p>
                    </div>
                )}

                <div className="flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => setIsNewUser(!isNewUser)}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        {isNewUser ? 'Already have an account? Login' : 'New user? Register'}
                    </button>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        {isNewUser ? 'Register' : 'Login'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LoginForm; 