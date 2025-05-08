import { NextResponse } from 'next/server';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-04-30.basil',
});

export async function POST(req: Request) {
    try {
        const { amount } = await req.json();

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount' },
                { status: 400 }
            );
        }

        // Create a payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents and ensure it's an integer
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (err) {
        console.error('Error creating payment intent:', err);
        return NextResponse.json(
            { error: 'Failed to create payment intent' },
            { status: 500 }
        );
    }
} 