'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type TimeSlot = 'full' | 'morning' | 'evening';

interface Room {
    id: number;
    name: string;
    image: string;
    description: string;
    selected: boolean;
    timeSlot: TimeSlot;
}

const BookingOptions = () => {
    const router = useRouter();
    const [selectedOption, setSelectedOption] = useState<'daily' | 'monthly'>('daily');
    const [rooms, setRooms] = useState<Room[]>([
        {
            id: 1,
            name: 'Room 1',
            image: '/images/room1.png',
            description: 'Modern examination room with medical bed, sink, and essential equipment. Features skeletal system chart and bright lighting.',
            selected: false,
            timeSlot: 'full'
        },
        {
            id: 2,
            name: 'Room 2',
            image: '/images/room2.png',
            description: 'Well-equipped treatment room with examination table, medical charts, and modern amenities. Perfect for patient consultations.',
            selected: false,
            timeSlot: 'full'
        },
        {
            id: 3,
            name: 'Room 3',
            image: '/images/room3.png',
            description: 'Spacious procedure room with large windows, built-in cabinets, and sink. Excellent natural lighting and modern fixtures.',
            selected: false,
            timeSlot: 'full'
        }
    ]);

    // Add authentication check
    React.useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            toast.error('Please login to continue');
            router.push('/');
        }
    }, [router]);

    const handleRoomSelect = (roomId: number) => {
        setRooms(rooms.map(room => {
            if (room.id === roomId) {
                const newSelected = !room.selected;
                if (newSelected) {
                    toast.success(`${room.name} selected`);
                } else {
                    toast.error(`${room.name} deselected`);
                }
                return { ...room, selected: newSelected };
            }
            return room;
        }));
    };

    const handleBookingTypeChange = (type: 'daily' | 'monthly') => {
        setSelectedOption(type);
        toast.success(`Switched to ${type} booking`);
    };

    const handleTimeSlotChange = (roomId: number, timeSlot: TimeSlot) => {
        setRooms(rooms.map(room => {
            if (room.id === roomId) {
                toast.success(`${room.name} time slot updated to ${timeSlot === 'full' ? 'Full Day' : timeSlot === 'morning' ? 'Morning' : 'Evening'}`);
                return { ...room, timeSlot };
            }
            return room;
        }));
    };

    const handleContinue = () => {
        // Check authentication
        const user = localStorage.getItem('user');
        if (!user) {
            toast.error('Please login to continue');
            router.push('/');
            return;
        }

        // Validate room selection
        const selectedRooms = rooms.filter(r => r.selected);
        if (selectedRooms.length === 0) {
            toast.error('Please select at least one room');
            return;
        }

        try {
            // Add dates array to each selected room before storing
            const roomsWithDates = selectedRooms.map(room => ({
                ...room,
                dates: []
            }));

            // Store booking data
            localStorage.setItem('bookingType', selectedOption);
            localStorage.setItem('selectedRooms', JSON.stringify(roomsWithDates));

            toast.success('Proceeding to calendar...');
            router.push('/booking/calendar');
        } catch (error) {
            console.error('Error storing booking data:', error);
            toast.error('Error preparing booking data');
        }
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12">
            <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={handleBack}
                        className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>

                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-bold text-gray-800 mb-4">Book Your Space</h1>
                        <p className="text-xl text-gray-600">Choose your preferred booking option and room(s)</p>
                    </div>

                    {/* Booking Type Selection */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-semibold mb-8 text-gray-800">Select Booking Type</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button
                                onClick={() => handleBookingTypeChange('daily')}
                                className={`p-8 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${selectedOption === 'daily'
                                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold text-xl mb-3">Daily Booking</h3>
                                    <p className="text-gray-600 text-center mb-4">Perfect for one-time appointments</p>
                                    <div className="text-blue-600 font-bold">
                                        Full Day: $300/room/day<br />
                                        Half Day: $160/room/day
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleBookingTypeChange('monthly')}
                                className={`p-8 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${selectedOption === 'monthly'
                                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold text-xl mb-3">Monthly Booking</h3>
                                    <p className="text-gray-600 text-center mb-4">Full month access</p>
                                    <div className="text-blue-600 font-bold">
                                        Full Day: $2000/room/month<br />
                                        Half Day: $1000/room/month
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Room Selection */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-semibold mb-8 text-gray-800">Select Room(s)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {rooms.map(room => (
                                <div key={room.id} className="relative rounded-xl overflow-hidden border-2 transition-all duration-300 transform hover:scale-105">
                                    <div
                                        onClick={() => handleRoomSelect(room.id)}
                                        className={`cursor-pointer ${room.selected
                                            ? 'border-blue-500 shadow-lg'
                                            : 'border-gray-200 hover:border-blue-300'
                                            }`}
                                    >
                                        <div className="aspect-w-16 aspect-h-9">
                                            <img
                                                src={room.image}
                                                alt={room.name}
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                        <div className="p-6">
                                            <h3 className="text-xl font-semibold mb-2 text-gray-800">{room.name}</h3>
                                            <p className="text-gray-600 mb-4">{room.description}</p>
                                            <div className="flex items-center">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${room.selected
                                                    ? 'bg-blue-500 border-blue-500'
                                                    : 'border-gray-300'
                                                    }`}>
                                                    {room.selected && (
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <span className="ml-2 text-gray-600">Select Room</span>
                                            </div>
                                        </div>
                                    </div>

                                    {room.selected && (
                                        <div className="p-6 bg-gray-50 border-t border-gray-200">
                                            <h4 className="font-medium mb-3">Select Time Slot</h4>
                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    onClick={() => handleTimeSlotChange(room.id, 'full')}
                                                    className={`p-2 rounded text-sm ${room.timeSlot === 'full'
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-white border border-gray-200 hover:border-blue-500'
                                                        }`}
                                                >
                                                    Full Day
                                                </button>
                                                <button
                                                    onClick={() => handleTimeSlotChange(room.id, 'morning')}
                                                    className={`p-2 rounded text-sm ${room.timeSlot === 'morning'
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-white border border-gray-200 hover:border-blue-500'
                                                        }`}
                                                >
                                                    Morning
                                                </button>
                                                <button
                                                    onClick={() => handleTimeSlotChange(room.id, 'evening')}
                                                    className={`p-2 rounded text-sm ${room.timeSlot === 'evening'
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-white border border-gray-200 hover:border-blue-500'
                                                        }`}
                                                >
                                                    Evening
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center">
                        <button
                            onClick={handleContinue}
                            className="bg-blue-600 text-white px-12 py-4 rounded-xl text-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            Continue to Calendar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingOptions; 