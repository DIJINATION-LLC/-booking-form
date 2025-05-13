import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { User } from '@/models/User';

export async function POST(req: Request) {
    try {
        await dbConnect();

        const { firstName, lastName, email, password } = await req.json();

        // Validate input
        if (!firstName || !lastName || !email || !password) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Validate password strength
        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        // Create user using Mongoose model
        const user = await User.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            password, // Password will be hashed by the model's pre-save hook
            hasBookings: false
        });

        return NextResponse.json({
            message: 'User registered successfully',
            userId: user._id.toString()
        });
    } catch (error) {
        console.error('Registration error:', error);

        // Handle duplicate email error
        if (error.code === 11000) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 409 }
            );
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map((err: any) => err.message);
            return NextResponse.json(
                { error: validationErrors.join(', ') },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to register user' },
            { status: 500 }
        );
    }
} 