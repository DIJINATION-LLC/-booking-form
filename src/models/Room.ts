import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Room name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Room description is required'],
        trim: true
    },
    imageUrl: {
        type: String,
        required: [true, 'Room image is required']
    },
    pricePerDay: {
        full: {
            type: Number,
            required: true,
            default: 300
        },
        half: {
            type: Number,
            required: true,
            default: 160
        }
    },
    pricePerMonth: {
        full: {
            type: Number,
            required: true,
            default: 2000
        },
        half: {
            type: Number,
            required: true,
            default: 1200
        }
    },
    securityDeposit: {
        type: Number,
        required: true,
        default: 250
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Room || mongoose.model('Room', roomSchema); 