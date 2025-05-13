import { connectToDatabase } from '@/lib/mongodb';

export default async function handler(req, res) {
    try {
        const { db } = await connectToDatabase();

        const collections = ['users', 'bookings', 'bookingSummaries'];
        const indexResults = {};

        for (const name of collections) {
            const indexes = await db.collection(name).indexes();
            indexResults[name] = indexes;
        }

        res.status(200).json({ status: 'success', indexes: indexResults });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}
