'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';
import Header from '@/components/Header';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PriceBreakdown {
    subtotal: number;
    tax: number;
    securityDeposit: number;
    total: number;
}

interface PaymentResponse {
    clientSecret: string;
    bookingIds: string[];
}

const PaymentForm = ({ priceBreakdown }: { priceBreakdown: PriceBreakdown }) => {
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        setError(null);

        try {
            // Get booking data from localStorage
            const bookingData = localStorage.getItem('bookingData');
            if (!bookingData) {
                throw new Error('No booking data found');
            }

            const parsedBookingData = JSON.parse(bookingData);

            // First, trigger form validation and submission
            const { error: submitError } = await elements.submit();
            if (submitError) {
                throw new Error(submitError.message);
            }

            // Create payment intent with booking data
            const response = await fetch('/api/payment/intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: priceBreakdown.total * 100, // Convert to cents
                    bookingData: parsedBookingData
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create payment intent');
            }

            const { clientSecret, bookingIds } = await response.json() as PaymentResponse;

            // Store booking IDs for confirmation
            localStorage.setItem('pendingBookingIds', JSON.stringify(bookingIds));

            // Confirm the payment
            const result = await stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}/booking/confirmation`,
                },
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

            // If we get here, it means the payment was successful
            router.push('/booking/confirmation');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Payment failed';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            {error && (
                <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    {error}
                </div>
            )}
            <button
                type="submit"
                disabled={!stripe || processing}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium 
                    ${!stripe || processing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {processing ? (
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                        Processing...
                    </div>
                ) : (
                    `Pay $${priceBreakdown.total.toFixed(2)}`
                )}
            </button>
        </form>
    );
};

const PaymentPage = () => {
    const router = useRouter();
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown>({
        subtotal: 0,
        tax: 0,
        securityDeposit: 0,
        total: 0
    });

    useEffect(() => {
        // Get booking details from localStorage
        const bookingData = localStorage.getItem('bookingData');
        if (!bookingData) {
            toast.error('No booking details found');
            router.push('/booking');
            return;
        }

        try {
            const parsedData = JSON.parse(bookingData);

            // Validate booking data
            if (!parsedData.rooms || !Array.isArray(parsedData.rooms) || parsedData.rooms.length === 0) {
                throw new Error('Invalid booking data: No rooms selected');
            }

            if (!parsedData.totalAmount || parsedData.totalAmount <= 0) {
                throw new Error('Invalid booking data: Invalid amount');
            }

            setPriceBreakdown({
                subtotal: parsedData.totalAmount * 0.93, // Remove tax and deposit
                tax: parsedData.totalAmount * 0.035,
                securityDeposit: 250,
                total: parsedData.totalAmount
            });

            // Create initial payment intent
            console.log('Attempting to create payment intent with data:', {
                amount: parsedData.totalAmount * 100,
                rooms: parsedData.rooms.length,
                bookingType: parsedData.bookingType
            });

            fetch('/api/payment/intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: parsedData.totalAmount * 100, // Convert to cents
                    bookingData: parsedData
                }),
            })
                .then(async response => {
                    console.log('Payment intent response status:', response.status);
                    const data = await response.json();
                    console.log('Payment intent response data:', data);

                    if (!response.ok) {
                        throw new Error(data.error || 'Failed to initialize payment');
                    }
                    return data;
                })
                .then((data: PaymentResponse) => {
                    console.log('Successfully created payment intent');
                    setClientSecret(data.clientSecret);
                    localStorage.setItem('pendingBookingIds', JSON.stringify(data.bookingIds));
                    setError(null); // Clear any previous errors
                })
                .catch(error => {
                    console.error('Detailed payment intent error:', {
                        message: error.message,
                        name: error.name,
                        stack: error.stack
                    });
                    const errorMessage = error instanceof Error ? error.message : 'Failed to initialize payment';
                    setError(errorMessage);
                    toast.error(errorMessage);
                });
        } catch (error) {
            console.error('Error processing booking data:', error);
            const errorMessage = error instanceof Error ? error.message : 'Invalid booking data';
            toast.error(errorMessage);
            router.push('/booking');
        }
    }, [router]);

    const handleBackClick = () => {
        // Clear any error state before going back
        setError(null);
        router.back();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
            {/* Header */}
            <header className="sticky top-0 left-0 right-0 z-50 bg-white shadow-md">
                <Header />
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={handleBackClick}
                        className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Summary
                    </button>

                    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-8">Payment Details</h1>

                        {error && (
                            <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                                <strong className="font-bold">Error: </strong>
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}

                        {/* Price Summary */}
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">Price Summary</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>${priceBreakdown.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax (3.5%)</span>
                                    <span>${priceBreakdown.tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <div>
                                        <span>Security Deposit</span>
                                        <div className="text-xs text-gray-500">($250 per room, refundable)</div>
                                    </div>
                                    <span>${priceBreakdown.securityDeposit.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-3 mt-3">
                                    <div className="flex justify-between font-semibold">
                                        <span>Total</span>
                                        <span className="text-blue-600">${priceBreakdown.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stripe Payment Form */}
                        {clientSecret ? (
                            <Elements stripe={stripePromise} options={{ clientSecret }}>
                                <PaymentForm priceBreakdown={priceBreakdown} />
                            </Elements>
                        ) : error ? (
                            <div className="text-center py-4">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PaymentPage; 