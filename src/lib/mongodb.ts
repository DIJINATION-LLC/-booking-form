import { MongoClient, MongoClientOptions } from 'mongodb';
import { cache } from 'react';

if (!process.env.MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Ensure the MongoDB URI is properly formatted
let uri = process.env.MONGODB_URI;
if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    // Try to fix common formatting issues
    if (uri.includes('@') && !uri.startsWith('mongodb')) {
        uri = `mongodb://${uri}`;
    } else {
        throw new Error('Invalid MONGODB_URI format. Must start with mongodb:// or mongodb+srv://');
    }
}

const options: MongoClientOptions = {
    maxPoolSize: 10,
    minPoolSize: 5,
    maxIdleTimeMS: 30000,
    connectTimeoutMS: 30000,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 30000,
    waitQueueTimeoutMS: 30000,
    retryWrites: true,
    retryReads: true
};

declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
        const client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect()
            .then(client => {
                console.log('Successfully connected to MongoDB');
                return client;
            })
            .catch(error => {
                console.error('Failed to connect to MongoDB:', error);
                throw error;
            });
    }
    clientPromise = global._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    const client = new MongoClient(uri, options);
    clientPromise = client.connect()
        .then(client => {
            console.log('Successfully connected to MongoDB');
            return client;
        })
        .catch(error => {
            console.error('Failed to connect to MongoDB:', error);
            throw error;
        });
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

// Cached database connection with retry mechanism
export const connectToDatabase = cache(async () => {
    let retries = 3;
    let lastError;

    while (retries > 0) {
        try {
            const client = await clientPromise;
            const dbName = process.env.MONGODB_DB || 'hire-a-clinic';
            const db = client.db(dbName);

            // Test the connection
            await db.command({ ping: 1 });
            console.log('Successfully connected to database:', dbName);

            return { client, db };
        } catch (error) {
            lastError = error;
            console.error(`Database connection attempt failed. Retries left: ${retries - 1}`, error);
            retries--;

            if (retries > 0) {
                // Wait for 1 second before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    console.error('All database connection attempts failed');
    throw lastError || new Error('Failed to establish database connection after multiple attempts');
});
