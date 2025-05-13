import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    typescript: true,
});

export async function POST(req: Request) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Please log in to continue with payment' },
                { status: 401 }
            );
        }

        const { amount, bookingData } = await req.json();

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: 'Please provide a valid payment amount' },
                { status: 400 }
            );
        }

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), // amount should already be in cents
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                userId: session.user.id,
                bookingType: bookingData.bookingType,
                roomCount: bookingData.rooms.length.toString()
            }
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error('Payment intent creation failed:', error);
        if (error instanceof Stripe.errors.StripeError) {
            return NextResponse.json(
                { error: `Payment service error: ${error.message}` },
                { status: error.statusCode || 500 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to create payment intent' },
            { status: 500 }
        );
    }
} 