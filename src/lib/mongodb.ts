import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var __nurshop_mongoose_cache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.__nurshop_mongoose_cache ?? {
  conn: null,
  promise: null,
};

globalThis.__nurshop_mongoose_cache = cached;

const DEFAULT_MONGODB_URI =
  "mongodb+srv://nextgen:nextgen2026@cluster0.qbunbkx.mongodb.net/NurShopBD?retryWrites=true&w=majority&appName=Cluster0";

/**
 * Next.js database connection manager.
 * Single persistent connection instance reused across all requests.
 */
export async function connectDB(): Promise<typeof mongoose | null> {
  let MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
  if (!MONGODB_URI || !MONGODB_URI.startsWith("mongodb")) {
    MONGODB_URI = DEFAULT_MONGODB_URI;
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 120_000,
      serverSelectionTimeoutMS: 20_000,
      connectTimeoutMS: 20_000,
      socketTimeoutMS: 45_000,
      heartbeatFrequencyMS: 30_000,
      retryWrites: true,
      retryReads: true,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        cached.conn = m;
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        cached.conn = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    console.error("MongoDB connection error:", err);
    return null;
  }
}

