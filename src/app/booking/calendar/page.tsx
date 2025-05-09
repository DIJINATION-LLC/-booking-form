'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { PRICING, TimeSlot, BookingType } from '@/constants/pricing';
import Header from '@/components/Header';

interface RoomBooking {
    id: number;
    name: string;
    image: string;
    description: string;
    selected: boolean;
    timeSlot: TimeSlot;
    dates: string[];
}

interface BookingStatus {
    date: string;
    roomId: string;
    type: 'none' | 'booked' | 'partial';
    timeSlots: TimeSlot[];
}

interface UserData {
    profileImage?: string;
    firstName: string;
    lastName: string;
    hasBookings: boolean;
}

interface StoredRoomBooking extends Omit<RoomBooking, 'dates'> {
    dates: string[];
}

const CalendarPage: React.FC = () => {
    const router = useRouter();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [bookingType, setBookingType] = useState<'daily' | 'monthly'>('daily');
    const [showTimeSlots, setShowTimeSlots] = useState(false);
    const [bookingStatus, setBookingStatus] = useState<BookingStatus[]>([]);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [selectedRooms, setSelectedRooms] = useState<RoomBooking[]>([]);
    const [showHalfDayOptions, setShowHalfDayOptions] = useState(false);

    useEffect(() => {
        // Check authentication using localStorage
        const user = localStorage.getItem('user');
        if (!user) {
            toast.error('Please login to continue');
            router.push('/');
            return;
        }

        // Set user data
        setUserData(JSON.parse(user));

        // Get stored booking data
        const storedRooms = localStorage.getItem('selectedRooms');
        const storedBookingType = localStorage.getItem('bookingType');

        if (!storedRooms || !storedBookingType) {
            toast.error('Please select rooms before proceeding to calendar');
            router.push('/booking');
            return;
        }

        try {
            const parsedRooms = JSON.parse(storedRooms);
            setSelectedRooms(parsedRooms);
            setBookingType(storedBookingType as 'daily' | 'monthly');
        } catch (error) {
            console.error('Error parsing stored data:', error);
            toast.error('Error loading booking data');
            router.push('/booking');
            return;
        }
    }, [router]);

    // Add new useEffect to fetch booking status when month or selected rooms change
    useEffect(() => {
        if (selectedRooms.length > 0) {
            console.log('Fetching booking status for rooms:', selectedRooms);
            fetchBookingStatus();
        }
    }, [currentMonth, selectedRooms, bookingType]);

    // Add useEffect to refetch when component mounts
    useEffect(() => {
        if (selectedRooms.length > 0) {
            console.log('Initial fetch of booking status');
            fetchBookingStatus();
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/');
    };

    const fetchBookingStatus = async () => {
        try {
            // Fetch booking status for each selected room
            const promises = selectedRooms.map(room => {
                const roomId = room.id.toString(); // Convert to string consistently
                return fetch('/api/bookings/status', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        month: currentMonth.getMonth() + 1,
                        year: currentMonth.getFullYear(),
                        roomId
                    }),
                }).then(res => res.json())
            });

            const results = await Promise.all(promises);
            console.log('Booking status results:', results);
            const allBookings = results.flatMap(result => result.bookings);
            console.log('All bookings:', allBookings);
            setBookingStatus(allBookings);
        } catch (error) {
            console.error('Failed to fetch booking status:', error);
            toast.error('Failed to load booking availability');
        }
    };

    const handleRoomSelection = (room: RoomBooking) => {
        setSelectedRooms(prev => {
            const isSelected = prev.some(r => r.id === room.id);
            if (isSelected) {
                toast.error('Room deselected');
                return prev.filter(r => r.id !== room.id);
            } else {
                toast.success('Room selected');
                return [...prev, { ...room, dates: [], timeSlot: 'full' }];
            }
        });
    };

    const handleDateSelection = (date: Date, roomId: number) => {
        const dateStr = date.toISOString().split('T')[0];
        const room = selectedRooms.find(r => r.id === roomId);

        if (!room) return;

        // Check if the slot is available
        if (!isTimeSlotAvailable(date, roomId, room.timeSlot)) {
            if (room.timeSlot === 'full') {
                toast.error('This date is not available for full day booking');
            } else {
                toast.error(`This ${room.timeSlot} slot is already booked`);
            }
            return;
        }

        if (bookingType === 'monthly') {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setMonth(endDate.getMonth() + 1);

            const dates: string[] = [];
            let currentDate = new Date(startDate);

            while (currentDate < endDate) {
                const day = currentDate.getDay();
                const dateStr = currentDate.toISOString().split('T')[0];

                // Only add if it's Monday–Friday and the slot is available
                if (day >= 1 && day <= 5 && isTimeSlotAvailable(currentDate, roomId, room.timeSlot)) {
                    dates.push(dateStr);
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }

            if (dates.length > 0) {
                setSelectedRooms(prev =>
                    prev.map(r =>
                        r.id === roomId ? { ...r, dates } : r
                    )
                );
                toast.success(`Selected ${dates.length} available weekdays`);
            } else {
                toast.error('No available weekdays found within one month range');
                return;
            }
        } else {
            // Daily booking
            setSelectedRooms(prev =>
                prev.map(r => {
                    if (r.id === roomId) {
                        const dateIndex = r.dates?.indexOf(dateStr) ?? -1;
                        let newDates = r.dates || [];

                        if (dateIndex === -1) {
                            // Adding new date
                            if (isTimeSlotAvailable(date, roomId, r.timeSlot)) {
                                newDates = [...newDates, dateStr];
                                toast.success(`Selected ${r.timeSlot} slot for ${new Date(dateStr).toLocaleDateString()}`);
                            } else {
                                toast.error(`${r.timeSlot} slot is not available for this date`);
                                return r;
                            }
                        } else {
                            // Removing date
                            newDates = newDates.filter(d => d !== dateStr);
                            toast.success(`Removed ${r.timeSlot} slot for ${new Date(dateStr).toLocaleDateString()}`);
                        }

                        return { ...r, dates: newDates };
                    }
                    return r;
                })
            );
        }

        // Save to localStorage
        localStorage.setItem('selectedRooms', JSON.stringify(selectedRooms));
        localStorage.setItem('bookingType', bookingType);
    };

    const handleTimeSlotChange = (roomId: number, timeSlot: TimeSlot) => {
        setSelectedRooms(prev =>
            prev.map(room => {
                if (room.id === roomId) {
                    // Clear any selected dates when changing time slot
                    return { ...room, timeSlot, dates: [] };
                }
                return room;
            })
        );

        // Save to localStorage
        localStorage.setItem('selectedRooms', JSON.stringify(selectedRooms));
    };

    const isTimeSlotAvailable = (date: Date, roomId: number, timeSlot: TimeSlot): boolean => {
        const dateStr = date.toISOString().split('T')[0];
        const status = bookingStatus.find(b =>
            b.date === dateStr &&
            b.roomId === roomId.toString()
        );

        // If no booking status found, all slots are available
        if (!status) return true;

        // If full day is booked, no slots are available
        if (status.timeSlots.includes('full')) return false;

        switch (timeSlot) {
            case 'full':
                // For full day booking, both morning and evening must be free
                return !status.timeSlots.includes('morning') && !status.timeSlots.includes('evening');
            case 'morning':
                // For morning booking, only morning slot must be free
                return !status.timeSlots.includes('morning');
            case 'evening':
                // For evening booking, only evening slot must be free
                return !status.timeSlots.includes('evening');
            default:
                return false;
        }
    };

    const getTimeSlotText = (slot: TimeSlot): string => {
        switch (slot) {
            case 'full':
                return 'Full Day';
            case 'morning':
                return 'Morning';
            case 'evening':
                return 'Evening';
        }
    };

    const calculatePrice = () => {
        let subtotal = 0;
        let securityDeposit = 0;

        // Calculate subtotal based on rooms and dates
        selectedRooms.forEach(room => {
            const numberOfDays = room.dates?.length || 0;
            if (numberOfDays === 0) return; // Skip rooms with no dates selected

            const basePrice = PRICING[bookingType][room.timeSlot];

            // Add to subtotal based on booking type
            if (bookingType === 'daily') {
                subtotal += basePrice * numberOfDays;
            } else {
                subtotal += basePrice; // Monthly price is flat rate
            }
        });

        // Add security deposit only once if there are any rooms with dates
        if (selectedRooms.some(room => (room.dates?.length || 0) > 0)) {
            securityDeposit = PRICING.securityDeposit;
        }

        // Calculate tax
        const tax = subtotal * PRICING.taxRate;

        // Return all price components
        return {
            subtotal,
            tax,
            securityDeposit,
            total: subtotal + tax + securityDeposit
        };
    };

    const handleRemoveRoom = (roomId: number) => {
        const updatedRooms = selectedRooms.filter(r => r.id !== roomId);
        setSelectedRooms(updatedRooms);
        localStorage.setItem('selectedRooms', JSON.stringify(updatedRooms));
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();

        const days = [];
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const days = getDaysInMonth(currentMonth);
    const isDateSelected = (date: Date): boolean => {
        const dateStr = date.toISOString().split('T')[0];
        return selectedRooms.some(room => room.dates?.includes(dateStr) || false);
    };

    const isWeekend = (date: Date | null): boolean => {
        if (!date) return false;
        const day = date.getDay();
        return day === 0 || day === 6;
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const isDateBooked = (date: Date, roomId: number, timeSlot: TimeSlot): boolean => {
        const dateStr = date.toISOString().split('T')[0];
        const roomIdStr = roomId.toString();
        const status = bookingStatus.find(b => b.date === dateStr && b.roomId === roomIdStr);

        if (!status) return false;

        if (status.timeSlots.includes('full')) return true;

        // For partial bookings, check if the requested time slot is available
        if (timeSlot === 'full') {
            // Can't book full day if any slot is taken
            return status.timeSlots.includes('morning') || status.timeSlots.includes('evening');
        }

        // For half-day bookings, only check the specific slot requested
        return status.timeSlots.includes(timeSlot);
    };

    const getDateClassName = (date: Date | null, room: RoomBooking) => {
        if (!date) return 'bg-gray-100 text-gray-400 cursor-not-allowed';

        const dateStr = date.toISOString().split('T')[0];
        const isSelected = room.dates?.includes(dateStr);

        // Check weekend first
        if (isWeekend(date)) {
            return 'bg-gray-100 text-gray-400 cursor-not-allowed';
        }

        // Get booking status
        const status = bookingStatus.find(b =>
            b.date === dateStr &&
            b.roomId === room.id.toString()
        );

        // Handle different booking states
        if (status) {
            if (status.timeSlots.includes('full')) {
                return 'bg-red-100 text-red-600 cursor-not-allowed';
            }

            const hasMorning = status.timeSlots.includes('morning');
            const hasEvening = status.timeSlots.includes('evening');

            // For morning slot booking
            if (room.timeSlot === 'morning') {
                if (hasMorning) {
                    return 'bg-red-100 text-red-600 cursor-not-allowed';
                }
                if (isSelected) {
                    return 'bg-gradient-to-b from-blue-500 to-transparent cursor-pointer';
                }
                return 'bg-white hover:bg-gradient-to-b hover:from-blue-100 hover:to-transparent cursor-pointer';
            }

            // For evening slot booking
            if (room.timeSlot === 'evening') {
                if (hasEvening) {
                    return 'bg-red-100 text-red-600 cursor-not-allowed';
                }
                if (isSelected) {
                    return 'bg-gradient-to-t from-blue-500 to-transparent cursor-pointer';
                }
                return 'bg-white hover:bg-gradient-to-t hover:from-blue-100 hover:to-transparent cursor-pointer';
            }

            // For full day booking
            if (room.timeSlot === 'full') {
                if (hasMorning || hasEvening) {
                    return 'bg-red-100 text-red-600 cursor-not-allowed';
                }
                if (isSelected) {
                    return 'bg-blue-500 text-white cursor-pointer';
                }
                return 'bg-white hover:bg-blue-50 cursor-pointer';
            }
        }

        // Handle selected states
        if (isSelected) {
            if (room.timeSlot === 'morning') {
                return 'bg-gradient-to-b from-blue-500 to-transparent cursor-pointer';
            } else if (room.timeSlot === 'evening') {
                return 'bg-gradient-to-t from-blue-500 to-transparent cursor-pointer';
            } else {
                return 'bg-blue-500 text-white cursor-pointer';
            }
        }

        // Default available state
        return 'bg-white hover:bg-blue-50 cursor-pointer';
    };

    const handleProceed = async () => {
        if (!userData) {
            toast.error('Please login to continue');
            router.push('/');
            return;
        }

        if (selectedRooms.length === 0) {
            toast.error('Please select at least one room');
            return;
        }

        const roomsWithDates = selectedRooms.filter(room => room.dates && room.dates.length > 0);
        if (roomsWithDates.length === 0) {
            toast.error('Please select dates for at least one room');
            return;
        }

        try {
            // Prepare booking data
            const bookingData = {
                rooms: selectedRooms.map(room => ({
                    id: room.id,
                    timeSlot: room.timeSlot,
                    dates: room.dates || []
                })),
                bookingType,
                totalAmount: calculatePrice().total
            };

            // Store booking data in localStorage for the summary page
            localStorage.setItem('bookingData', JSON.stringify(bookingData));

            // Clear selected rooms from localStorage since we're moving to summary
            localStorage.removeItem('selectedRooms');
            localStorage.removeItem('bookingType');

            toast.success('Proceeding to booking summary...');
            router.push('/booking/summary');
        } catch (error) {
            console.error('Failed to proceed to summary:', error);
            toast.error('Failed to proceed to booking summary. Please try again.');
        }
    };

    const renderTimeSlotButtons = (room: RoomBooking) => {
        const hasPartialBooking = selectedRooms.some(r =>
            r.id === room.id && r.dates?.some(dateStr => {
                const status = bookingStatus.find(b =>
                    b.date === dateStr &&
                    b.roomId === room.id.toString()
                );
                return status && (status.timeSlots.includes('morning') || status.timeSlots.includes('evening'));
            })
        );

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                    onClick={() => handleTimeSlotChange(room.id, 'full')}
                    disabled={hasPartialBooking}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 
                        ${room.timeSlot === 'full'
                            ? 'border-blue-500 bg-blue-50 shadow-lg'
                            : hasPartialBooking
                                ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                                : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                >
                    <div className="flex flex-col items-center">
                        <h3 className="font-semibold text-xl mb-2">Full Day</h3>
                        <p className="text-gray-600">8:00 AM - 5:00 PM</p>
                        <div className="text-blue-600 font-bold mt-2">
                            ${PRICING[bookingType].full}/{bookingType === 'daily' ? 'day' : 'month'}
                        </div>
                        {hasPartialBooking && (
                            <p className="text-xs text-red-500 mt-2">Not available with half-day bookings</p>
                        )}
                    </div>
                </button>

                <button
                    onClick={() => {
                        setShowHalfDayOptions(true);
                        handleTimeSlotChange(room.id, 'morning');
                    }}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 
                        ${room.timeSlot !== 'full'
                            ? 'border-blue-500 bg-blue-50 shadow-lg'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                >
                    <div className="flex flex-col items-center">
                        <h3 className="font-semibold text-xl mb-2">Half Day</h3>
                        <p className="text-gray-600">Morning or Evening</p>
                        <div className="text-blue-600 font-bold mt-2">
                            ${PRICING[bookingType].morning}/{bookingType === 'daily' ? 'day' : 'month'}
                        </div>
                    </div>
                </button>
            </div>
        );
    };

    // Show loading state while checking authentication
    if (!userData) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
            <Header />
            <div className="container mx-auto px-4 pt-20">
                <div className="max-w-6xl mx-auto">
                    {selectedRooms.length === 0 && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                            <div className="flex items-center justify-center text-red-600 mb-2">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="font-medium">Please Select a Room</span>
                            </div>
                            <p className="text-red-500">You must select at least one room before proceeding with the booking.</p>
                        </div>
                    )}

                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Room Selection
                    </button>

                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-bold text-gray-800 mb-4">Select Dates for Your Rooms</h1>
                        <p className="text-xl text-gray-600">Choose dates and time slots for each selected room</p>
                    </div>

                    {/* Calendar Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            {selectedRooms.map(room => (
                                <div key={room.id} className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                                    <h2 className="text-3xl font-semibold mb-6">Select Time Slot for {room.name}</h2>
                                    {renderTimeSlotButtons(room)}

                                    {showHalfDayOptions && (
                                        <div className="mt-6 space-y-4">
                                            <h3 className="text-xl font-semibold mb-4">Select Half-Day Time Slot</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => handleTimeSlotChange(room.id, 'morning')}
                                                    disabled={room.dates?.some(dateStr => {
                                                        const status = bookingStatus.find(b =>
                                                            b.date === dateStr &&
                                                            b.roomId === room.id.toString()
                                                        );
                                                        return status && status.timeSlots.includes('morning');
                                                    })}
                                                    className={`p-6 rounded-xl border-2 transition-all duration-300 
                                                        ${room.timeSlot === 'morning'
                                                            ? 'border-blue-500 bg-blue-50 shadow-lg'
                                                            : room.dates?.some(dateStr => {
                                                                const status = bookingStatus.find(b =>
                                                                    b.date === dateStr &&
                                                                    b.roomId === room.id.toString()
                                                                );
                                                                return status && status.timeSlots.includes('morning');
                                                            })
                                                                ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                                                                : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                                                        }`}
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <h3 className="font-semibold text-xl mb-2">Morning</h3>
                                                        <p className="text-gray-600">8:00 AM - 12:00 PM</p>
                                                    </div>
                                                </button>

                                                <button
                                                    onClick={() => handleTimeSlotChange(room.id, 'evening')}
                                                    disabled={room.dates?.some(dateStr => {
                                                        const status = bookingStatus.find(b =>
                                                            b.date === dateStr &&
                                                            b.roomId === room.id.toString()
                                                        );
                                                        return status && status.timeSlots.includes('evening');
                                                    })}
                                                    className={`p-6 rounded-xl border-2 transition-all duration-300 
                                                        ${room.timeSlot === 'evening'
                                                            ? 'border-blue-500 bg-blue-50 shadow-lg'
                                                            : room.dates?.some(dateStr => {
                                                                const status = bookingStatus.find(b =>
                                                                    b.date === dateStr &&
                                                                    b.roomId === room.id.toString()
                                                                );
                                                                return status && status.timeSlots.includes('evening');
                                                            })
                                                                ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                                                                : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                                                        }`}
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <h3 className="font-semibold text-xl mb-2">Evening</h3>
                                                        <p className="text-gray-600">1:00 PM - 5:00 PM</p>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Calendar */}
                                    <div className="mt-8">
                                        <div className="flex items-center justify-between mb-8">
                                            <h2 className="text-3xl font-semibold">
                                                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                            </h2>
                                            <div className="flex space-x-4">
                                                <button
                                                    onClick={handlePrevMonth}
                                                    className="p-2 rounded-full hover:bg-gray-100"
                                                >
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={handleNextMonth}
                                                    className="p-2 rounded-full hover:bg-gray-100"
                                                >
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-7 gap-2 mb-4">
                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                                <div key={day} className="text-center font-semibold text-gray-600">
                                                    {day}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-7 gap-2">
                                            {getDaysInMonth(currentMonth).map((date, index) => {
                                                const isBooked = date && isDateBooked(date, room.id, room.timeSlot);
                                                const isWeekendDay = date && isWeekend(date);
                                                const canSelect = date && !isWeekendDay && !isBooked;

                                                return (
                                                    <button
                                                        key={index}
                                                        onClick={() => canSelect && handleDateSelection(date, room.id)}
                                                        disabled={!canSelect}
                                                        className={`aspect-square p-2 rounded-lg text-center transition-all duration-200 ${getDateClassName(date, room)}`}
                                                        title={
                                                            !date ? "" :
                                                                isWeekendDay ? "Weekend is not available" :
                                                                    isBooked ? `This time slot (${room.timeSlot}) is already booked` :
                                                                        ""
                                                        }
                                                    >
                                                        {date?.getDate()}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="mt-6 space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                                <span>Selected Date</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 bg-red-100 rounded"></div>
                                                <span>Fully Booked</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 bg-gradient-to-b from-red-100 from-50% to-white to-50% rounded"></div>
                                                <span>Morning Booked</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 bg-gradient-to-b from-white from-50% to-red-100 to-50% rounded"></div>
                                                <span>Evening Booked</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 bg-gray-100 rounded"></div>
                                                <span>Weekend/Unavailable</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Right Column - Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-xl p-8 sticky top-8">
                                <h2 className="text-2xl font-semibold mb-6">Booking Summary</h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Booking Type:</span>
                                        <span className="font-medium capitalize">{bookingType}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Selected Dates:</span>
                                        <span className="font-medium">{selectedRooms.reduce((total, room) => total + (room.dates?.length || 0), 0)} days</span>
                                    </div>

                                    {/* Selected Rooms Section */}
                                    <div className="border-t border-gray-200 pt-4">
                                        <h3 className="text-lg font-semibold mb-3">Selected Rooms</h3>
                                        <div className="space-y-4">
                                            {selectedRooms.map(room => (
                                                <div key={room.id} className="bg-gray-50 p-4 rounded-lg">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <span className="font-medium">{room.name}</span>
                                                            <div className="text-sm text-gray-600">
                                                                {room.timeSlot === 'full' ? 'Full Day' : room.timeSlot === 'morning' ? 'Morning' : 'Evening'}
                                                            </div>
                                                            <div className="text-sm text-blue-600">
                                                                ${PRICING[bookingType][room.timeSlot]}/{bookingType === 'daily' ? 'day' : 'month'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Show dates separately */}
                                                    <div className="mt-2 space-y-2">
                                                        {room.dates?.map((date) => (
                                                            <div key={date} className="flex justify-between items-center bg-white p-2 rounded-md text-sm">
                                                                <span>{new Date(date).toLocaleDateString('en-US', {
                                                                    weekday: 'short',
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })}</span>
                                                                {bookingType === 'daily' && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedRooms(prev =>
                                                                                prev.map(r =>
                                                                                    r.id === room.id
                                                                                        ? { ...r, dates: (r.dates || []).filter(d => d !== date) }
                                                                                        : r
                                                                                ).filter(r => r.dates && r.dates.length > 0)
                                                                            );
                                                                            toast.success('Date removed');
                                                                        }}
                                                                        className="text-red-500 hover:text-red-700 p-1"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 my-4"></div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm text-gray-600">
                                            <span>Price per room:</span>
                                            <span>${PRICING[bookingType][selectedRooms[0]?.timeSlot || 'full']}/{bookingType === 'daily' ? 'day' : 'month'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm text-gray-600">
                                            <span>Number of rooms with dates:</span>
                                            <span>× {selectedRooms.filter(room => (room.dates?.length || 0) > 0).length}</span>
                                        </div>
                                        {bookingType === 'daily' && (
                                            <div className="flex justify-between items-center text-sm text-gray-600">
                                                <span>Number of days:</span>
                                                <span>× {selectedRooms.reduce((total, room) => total + (room.dates?.length || 0), 0)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-sm">
                                            <span>Subtotal:</span>
                                            <span>${calculatePrice().subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm text-gray-600">
                                            <span>Tax (3.5%):</span>
                                            <span>+ ${calculatePrice().tax.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm text-gray-600">
                                            <div>
                                                <span>Security Deposit</span>
                                                <div className="text-xs text-gray-500">($250 one-time, refundable)</div>
                                            </div>
                                            <span>+ ${calculatePrice().securityDeposit.toFixed(2)}</span>
                                        </div>
                                        <div className="border-t border-gray-200 pt-3 mt-3">
                                            <div className="flex justify-between font-semibold">
                                                <span>Total Price:</span>
                                                <span className="text-blue-600">${calculatePrice().total.toFixed(2)}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                *Security deposit will be refunded after inspection
                                            </div>
                                        </div>
                                    </div>

                                    {/* Add proceed button */}
                                    <div className="mt-6">
                                        <button
                                            onClick={handleProceed}
                                            disabled={selectedRooms.length === 0 || selectedRooms.every(room => !room.dates?.length)}
                                            className={`w-full py-3 px-4 rounded-lg text-white font-medium ${selectedRooms.length === 0 || selectedRooms.every(room => !room.dates?.length)
                                                ? 'bg-gray-300 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 transition-colors duration-200'
                                                }`}
                                        >
                                            {selectedRooms.length === 0
                                                ? 'Select a Room to Proceed'
                                                : selectedRooms.every(room => !room.dates?.length)
                                                    ? 'Select Dates to Proceed'
                                                    : 'Proceed to Booking Summary'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;









// 
// klkjdghjkhjkrhgrkg

//  line 111
// const handleDateSelection = (date: Date, roomId: number) => {
//     if (bookingType === 'monthly') {
//         // For monthly bookings, select all dates in the month
//         const year = date.getFullYear();
//         const month = date.getMonth();
//         const daysInMonth = new Date(year, month + 1, 0).getDate();
//         const dates = Array.from({ length: daysInMonth }, (_, i) => {
//             const newDate = new Date(year, month, i + 1);
//             return newDate.toISOString().split('T')[0];
//         }).filter(dateStr => {
//             const d = new Date(dateStr);
//             return !isWeekend(d) && !isDateBooked(d);
//         });

//         setSelectedRooms(prev =>
//             prev.map(room =>
//                 room.id === roomId
//                     ? { ...room, dates: dates }
//                     : room
//             )
//         );

//         if (dates.length > 0) {
//             toast.success(`Selected ${dates.length} available dates`);
//         }
//     } else {
//         setSelectedRooms(prev =>
//             prev.map(room => {
//                 if (room.id === roomId) {
//                     const dateStr = date.toISOString().split('T')[0];
//                     const dateIndex = room.dates?.indexOf(dateStr) ?? -1;
//                     let newDates = room.dates || [];

//                     if (dateIndex === -1) {
//                         newDates = [...newDates, dateStr];
//                     } else {
//                         newDates = newDates.filter(d => d !== dateStr);
//                     }

//                     return { ...room, dates: newDates };
//                 }
//                 return room;
//             })
//         );
//     }

//     // Save to localStorage
//     localStorage.setItem('selectedRooms', JSON.stringify(selectedRooms));
//     localStorage.setItem('bookingType', bookingType);
// };



//  line 281   

// const getDateClassName = (date: Date | null, room: RoomBooking) => {
//     if (!date) return 'bg-gray-100 text-gray-400 cursor-not-allowed';

//     const dateStr = date.toISOString().split('T')[0];
//     const isSelected = room.dates?.includes(dateStr);

//     if (isWeekend(date)) {
//         return 'bg-gray-100 text-gray-400 cursor-not-allowed';
//     }

//     if (isDateBooked(date)) {
//         return 'bg-red-100 text-red-600 cursor-not-allowed';
//     }

//     if (isSelected) {
//         return 'bg-blue-500 text-white hover:bg-blue-600';
//     }

//     return 'bg-white hover:bg-blue-50 cursor-pointer';
// };
