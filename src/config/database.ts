import Mongoose from 'mongoose';

export default async () => Mongoose.connect(process.env.MONGODB_URL || '');
