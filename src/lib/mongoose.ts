import mongoose from 'mongoose';

const mongoUri = process.env.MONGO_URL || '';

export async function connectMongo() {
    try {
        await mongoose.connect(mongoUri);
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
}
