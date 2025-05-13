import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./mongodb";
import { compare } from "bcryptjs";
import { connectToDatabase } from "./mongodb";
import { Adapter } from "next-auth/adapters";
import { cache } from 'react';

// Extend the default session type
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            firstName: string;
            lastName: string;
        }
    }
}

// Extend the default JWT token type
declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        email: string;
        name: string;
        firstName: string;
        lastName: string;
    }
}

if (!process.env.NEXTAUTH_SECRET) {
    throw new Error('Please define NEXTAUTH_SECRET environment variable');
}

// Cache user lookup
const findUserByEmail = cache(async (email: string) => {
    try {
        console.log('Looking up user by email:', email);
        const { db } = await connectToDatabase();
        const user = await db.collection("users").findOne({ email: email.toLowerCase() });
        console.log('User lookup result:', user ? 'User found' : 'User not found');
        return user;
    } catch (error) {
        console.error('Error finding user:', error);
        throw error;
    }
});

export const authOptions: NextAuthOptions = {
    adapter: MongoDBAdapter(clientPromise) as Adapter,
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60, // 24 hours
    },
    pages: {
        signIn: "/login",
        error: "/login", // Redirect back to login page with error
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                try {
                    console.log('Starting authorization for email:', credentials?.email);

                    if (!credentials?.email || !credentials?.password) {
                        console.error('Missing credentials');
                        throw new Error("Please enter both email and password");
                    }

                    const user = await findUserByEmail(credentials.email);

                    if (!user) {
                        console.error('User not found');
                        throw new Error("Invalid email or password");
                    }

                    console.log('Comparing passwords...');
                    const isPasswordValid = await compare(credentials.password, user.password);

                    if (!isPasswordValid) {
                        console.error('Invalid password');
                        throw new Error("Invalid email or password");
                    }

                    console.log('Authorization successful');
                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name || `${user.firstName} ${user.lastName}`,
                        firstName: user.firstName,
                        lastName: user.lastName,
                    };
                } catch (error) {
                    console.error('Authorization error:', error);
                    throw error;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            try {
                if (user) {
                    console.log('Setting JWT token data from user');
                    token.id = user.id;
                    token.email = user.email;
                    token.name = user.name;
                    token.firstName = user.firstName;
                    token.lastName = user.lastName;
                }
                // Handle user updates
                if (trigger === "update" && session) {
                    console.log('Updating JWT token with session data');
                    token = { ...token, ...session };
                }
                return token;
            } catch (error) {
                console.error('JWT callback error:', error);
                throw error;
            }
        },
        async session({ session, token }) {
            try {
                console.log('Setting session data from token');
                if (session.user) {
                    session.user.id = token.id;
                    session.user.email = token.email || '';
                    session.user.name = token.name || '';
                    session.user.firstName = token.firstName;
                    session.user.lastName = token.lastName;
                }
                return session;
            } catch (error) {
                console.error('Session callback error:', error);
                throw error;
            }
        }
    },
    // Only enable debug in development and when explicitly enabled
    debug: process.env.NEXTAUTH_DEBUG === "true" || false,
}; 