import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    typescript: true,
});

export async function POST(req: Request) {
    const body = await req.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
        return NextResponse.json(
            { error: 'No signature found' },
            { status: 400 }
        );
    }

    try {
        const event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        const { db } = await connectToDatabase();

        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const userId = paymentIntent.metadata.userId;

                // Update booking status
                await db.collection('bookings').updateMany(
                    {
                        userId,
                        'paymentDetails.paymentIntentId': paymentIntent.id,
                        status: 'pending'
                    },
                    {
                        $set: {
                            status: 'confirmed',
                            'paymentDetails.status': 'paid',
                            'paymentDetails.paidAt': new Date(),
                            updatedAt: new Date()
                        }
                    }
                );

                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const userId = paymentIntent.metadata.userId;

                // Update booking status
                await db.collection('bookings').updateMany(
                    {
                        userId,
                        'paymentDetails.paymentIntentId': paymentIntent.id,
                        status: 'pending'
                    },
                    {
                        $set: {
                            status: 'failed',
                            'paymentDetails.status': 'failed',
                            'paymentDetails.failedAt': new Date(),
                            updatedAt: new Date()
                        }
                    }
                );

                break;
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 400 }
        );
    }
} 