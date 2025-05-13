// pages/api/check-native.ts
import { connectToDatabase } from '@/lib/mongodb';

export default async function handler(req, res) {
    try {
        const { db } = await connectToDatabase();
        const collections = await db.listCollections().toArray();

        res.status(200).json({
            status: 'success',
            collections: collections.map(c => c.name),
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
}
