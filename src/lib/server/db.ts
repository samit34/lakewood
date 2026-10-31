import 'server-only';
import mongoose from 'mongoose';
import { env } from './env';

// Serverless functions are reused between requests: keep one connection per instance
// instead of opening a new one per request (which exhausts Atlas connection limits).
const g = globalThis as unknown as { _mongoose?: Promise<typeof mongoose> };

export function connectDb() {
  if (!g._mongoose) {
    mongoose.set('strictQuery', true);
    g._mongoose = mongoose
      .connect(env.mongodbUri, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 })
      .catch((err) => {
        g._mongoose = undefined;
        throw err;
      });
  }
  return g._mongoose;
}
