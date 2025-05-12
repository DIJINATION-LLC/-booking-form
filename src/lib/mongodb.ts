import { MongoClient } from 'mongodb';

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

const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
        client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect()
            .catch(error => {
                console.error('Failed to connect to MongoDB:', error);
                throw error;
            });
    }
    clientPromise = global._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect()
        .catch(error => {
            console.error('Failed to connect to MongoDB:', error);
            throw error;
        });
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

export async function connectToDatabase() {
    try {
        console.log('Attempting to connect to MongoDB...');
        const client = await clientPromise;
        const dbName = process.env.MONGODB_DB || 'hire-a-clinic';
        const db = client.db(dbName);

        // Test the connection
        await db.command({ ping: 1 });
        console.log('Successfully connected to MongoDB database:', dbName);

        return { client, db };
    } catch (error) {
        console.error('Database connection error:', error);
        // Check if it's a connection error
        if (error instanceof Error) {
            if (error.message.includes('ECONNREFUSED')) {
                throw new Error('Could not connect to MongoDB. Please check if MongoDB is running.');
            }
            if (error.message.includes('Authentication failed')) {
                throw new Error('MongoDB authentication failed. Please check your credentials.');
            }
            if (error.message.includes('Invalid connection string')) {
                throw new Error('Invalid MongoDB connection string. Please check your MONGODB_URI.');
            }
        }
        throw new Error('Failed to establish database connection. Please try again later.');
    }
}
