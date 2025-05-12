import mongoose from 'mongoose';

export interface PaymentDetails {
    cardLast4: string;
    cardholderName: string;
}

export interface IBooking {
    userId: string;
    roomId: string;
    dates: string[];
    timeSlot: 'full' | 'morning' | 'evening';
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    totalAmount: number;
    paymentDetails: PaymentDetails;
    createdAt: Date;
    updatedAt: Date;
}

const paymentDetailsSchema = new mongoose.Schema<PaymentDetails>({
    cardLast4: { type: String, required: true },
    cardholderName: { type: String, required: true }
}, { _id: false });

const bookingSchema = new mongoose.Schema<IBooking>({
    userId: { type: String, required: true },
    roomId: { type: String, required: true },
    dates: [{ type: String, required: true }],
    timeSlot: {
        type: String,
        required: true,
        enum: ['full', 'morning', 'evening']
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    totalAmount: { type: Number, required: true },
    paymentDetails: { type: paymentDetailsSchema, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Create indexes for faster queries
bookingSchema.index({ userId: 1, createdAt: -1 }); // For fetching user's bookings
bookingSchema.index({ roomId: 1, dates: 1, timeSlot: 1 }); // For checking booking conflicts

// Update the updatedAt field on save
bookingSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Check if the model is already defined to prevent OverwriteModelError
const Booking = mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking; 