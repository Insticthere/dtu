/**
 * db.js — MongoDB connection via Mongoose
 *
 * Uses MONGO_URI from environment (set in the project-root .env).
 * We connect once at startup and Mongoose manages the connection pool.
 * If the connection fails, we log and exit — there's no sensible way
 * to run this app without a database, and a silent failure would be worse.
 */
import mongoose from 'mongoose';

const connectDB = async () => {
  // Reuse existing connection if already connected (important for serverless invocations)
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are no longer needed in Mongoose 8+ (they're defaults),
      // but kept for clarity and backwards-compatibility readability.
      // useNewUrlParser: true,  // deprecated in Mongoose 8
      // useUnifiedTopology: true, // deprecated in Mongoose 8
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // Confirm we are NOT hitting localhost — per spec, this must be Atlas.
    if (conn.connection.host.includes('localhost') || conn.connection.host.includes('127.0.0.1')) {
      console.warn('⚠️  WARNING: Connected to a local MongoDB instance. The spec requires a remote Atlas cluster.');
    }
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    // Exit with failure code in standalone dev/prod so process manager can alert,
    // but in serverless throw error to let function response handle failure.
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw err;
  }
};

export default connectDB;
