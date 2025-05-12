import { NextResponse } from 'next/server';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    typescript: true,
});

export async function POST(req: Request) {
    if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json(
            { error: 'Stripe is not properly configured' },
            { status: 500 }
        );
    }

    try {
        const { amount } = await req.json();

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        return NextResponse.json(
            { error: 'Failed to create payment intent' },
            { status: 500 }
        );
    }
} 