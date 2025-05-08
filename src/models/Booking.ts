import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String,
        enum: ['full', 'morning', 'evening'],
        required: true
    },
    bookingType: {
        type: String,
        enum: ['daily', 'monthly'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create compound index for unique bookings
bookingSchema.index({ roomId: 1, date: 1, timeSlot: 1 }, { unique: true });

export default mongoose.models.Booking || mongoose.model('Booking', bookingSchema); 