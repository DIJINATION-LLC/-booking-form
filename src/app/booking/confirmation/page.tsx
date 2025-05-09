'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Header from '@/components/Header';
import jsPDF from 'jspdf';

interface BookingDetails {
    rooms: Array<{
        id: number;
        name: string;
        timeSlot: 'full' | 'morning' | 'evening';
        dates: string[];
    }>;
    totalAmount: number;
    bookingType: 'daily' | 'monthly';
    bookingDate: string;
}

const ConfirmationPage = () => {
    const router = useRouter();
    const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        try {
            // Get confirmation details
            const confirmationData = localStorage.getItem('confirmationData');
            if (!confirmationData) {
                console.error('No confirmation data found in localStorage');
                toast.error('No booking confirmation found');
                router.push('/booking');
                return;
            }

            setBookingDetails(JSON.parse(confirmationData));
        } catch (error) {
            console.error('Error parsing confirmation data:', error);
            toast.error('Invalid confirmation data');
            router.push('/booking');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getTimeSlotText = (timeSlot: 'full' | 'morning' | 'evening') => {
        switch (timeSlot) {
            case 'full':
                return '8:00 AM - 5:00 PM';
            case 'morning':
                return '8:00 AM - 12:00 PM';
            case 'evening':
                return '1:00 PM - 5:00 PM';
        }
    };

    const generatePDF = (booking: BookingDetails): jsPDF => {
        const pdf = new jsPDF();
        let yPos = 20;
        const lineHeight = 7;
        const margin = 20;
        const pageWidth = pdf.internal.pageSize.width;

        // Helper function to add centered text
        const addCenteredText = (text: string, y: number, size = 12) => {
            pdf.setFontSize(size);
            const textWidth = pdf.getTextWidth(text);
            const xPos = (pageWidth - textWidth) / 2;
            pdf.text(text, xPos, y);
            return y + lineHeight;
        };

        // Helper function to add left-aligned text
        const addText = (text: string, y: number, size = 12) => {
            pdf.setFontSize(size);
            pdf.text(text, margin, y);
            return y + lineHeight;
        };

        // Title
        pdf.setFont("helvetica", "bold");
        yPos = addCenteredText('HIRE A CLINIC - BOOKING CONFIRMATION', yPos, 16);
        pdf.setFont("helvetica", "normal");

        yPos += lineHeight;

        // Booking Info
        yPos = addText(`Booking Date: ${new Date(booking.bookingDate).toLocaleString()}`, yPos);
        yPos = addText(`Booking Type: ${booking.bookingType.charAt(0).toUpperCase() + booking.bookingType.slice(1)}`, yPos);
        yPos += lineHeight;

        // Room Details
        pdf.setFont("helvetica", "bold");
        yPos = addText('ROOM DETAILS', yPos, 14);
        pdf.setFont("helvetica", "normal");
        yPos += lineHeight / 2;

        booking.rooms.forEach(room => {
            yPos = addText(`Room: ${room.name}`, yPos);
            yPos = addText(`Time Slot: ${getTimeSlotText(room.timeSlot)}`, yPos);
            yPos = addText('Dates:', yPos);
            room.dates.forEach(date => {
                yPos = addText(`  • ${formatDate(date)}`, yPos);
            });
            yPos += lineHeight;
        });

        // Payment Details
        pdf.setFont("helvetica", "bold");
        yPos = addText('PAYMENT DETAILS', yPos, 14);
        pdf.setFont("helvetica", "normal");
        yPos += lineHeight / 2;

        yPos = addText(`Total Amount: $${booking.totalAmount.toFixed(2)}`, yPos);
        yPos = addText('Security Deposit: $250.00 (Refundable)', yPos);
        yPos += lineHeight;

        // Footer
        yPos = addText('Thank you for choosing Hire a Clinic!', yPos);
        yPos = addText('For any queries, please contact our support team.', yPos);

        return pdf;
    };

    const handleDownload = () => {
        if (!bookingDetails) return;
        setIsDownloading(true);

        try {
            const pdf = generatePDF(bookingDetails);
            pdf.save(`booking-confirmation-${new Date().getTime()}.pdf`);
            toast.success('Booking confirmation downloaded successfully');
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Failed to download booking confirmation');
        } finally {
            setIsDownloading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!bookingDetails) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">No Booking Found</h1>
                    <p className="text-gray-600 mb-6">We couldn't find your booking confirmation.</p>
                    <button
                        onClick={() => router.push('/booking')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                        Make a New Booking
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
            <Header />
            <div className="container mx-auto px-4 pt-20">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Booking Confirmed!</h1>
                            <p className="text-gray-600">Your booking has been successfully completed</p>
                            <p className="text-sm text-gray-500 mt-1">Booking Date: {formatDate(bookingDetails.bookingDate)}</p>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-xl font-semibold border-b border-gray-200 pb-2">Booking Details</h2>
                            {bookingDetails.rooms.map((room) => (
                                <div key={room.id} className="bg-gray-50 rounded-xl p-6 mt-4">
                                    <h3 className="font-semibold text-lg mb-4">{room.name}</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-gray-600 text-sm">Time Slot:</span>
                                            <p className="font-medium">{getTimeSlotText(room.timeSlot)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 text-sm">Booking Type:</span>
                                            <p className="font-medium capitalize">{bookingDetails.bookingType}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <span className="text-gray-600 text-sm">Selected Dates:</span>
                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {room.dates.map((date) => (
                                                <div key={date} className="bg-white p-2 rounded border border-gray-200">
                                                    <span className="text-sm">{formatDate(date)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-200 pt-6 mb-8">
                            <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Total Amount Paid:</span>
                                    <span className="text-xl font-bold text-blue-600">${bookingDetails.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className={`inline-flex items-center justify-center px-6 py-3 rounded-lg text-white ${isDownloading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                    } transition-colors duration-200`}
                            >
                                {isDownloading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                                        Downloading...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download Confirmation
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => router.push('/')}
                                className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                            >
                                Back to Main Page
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationPage; 